/**
 * ZOLA Payment Integration
 * 
 * This file handles all payment integrations:
 * - Stripe for Card payments
 * - PayPal for PayPal payments
 * - Coinbase Commerce for Crypto payments
 * - Wire Transfer (manual process)
 */

// Debug flag - set to true to enable console debugging
const DEBUG = true;

// Global variables
let stripe;
let stripeElements;
let stripeCardElement;
let paypalInitialized = false;
let cryptoInitialized = false;
let currentPaymentIntent = null;

// Debug function
function debug(message, data) {
  if (DEBUG) {
    console.log(`[PAYMENT DEBUG] ${message}`, data || '');
  }
}

// Initialize payment methods on page load
document.addEventListener('DOMContentLoaded', function() {
  debug('DOM Content Loaded - Initializing payment methods');
  
  // Add a direct click handler to the main payment button for PayPal
  const paymentButton = document.getElementById('payment-button');
  if (paymentButton) {
    debug('Found payment button, adding direct click handler');
    paymentButton.addEventListener('click', function(e) {
      const selectedMethod = document.querySelector('.radio-button.selected')
                            ?.closest('.payment-method-header')
                            ?.getAttribute('data-method');
      
      debug('Payment button clicked, selected method:', selectedMethod);
      
      if (selectedMethod === 'paypal') {
        e.preventDefault();
        directPayPalRedirect();
        return false;
      }
    });
  } else {
    debug('Warning: Payment button not found!');
  }
  
  // Initialize the default selected payment method (wire transfer)
  initializePaymentGateway('wire-transfer');
  
  // Load Stripe by default (to speed up card payment when selected)
  loadStripeScript();
  
  // Check if card payment method is pre-selected and initialize it
  const selectedMethod = document.querySelector('.radio-button.selected')
                         ?.closest('.payment-method-header')
                         ?.getAttribute('data-method');
  if (selectedMethod === 'card') {
    debug('Card payment method is pre-selected, initializing Stripe');
    initializeStripe();
  }
});

/**
 * Direct PayPal Redirect (Fixed implementation)
 */
function directPayPalRedirect() {
  debug('Using direct PayPal redirect');
  
  // Get the total amount from the page
  const totalAmountElement = document.getElementById('total-amount');
  const totalText = totalAmountElement.textContent;
  // Properly handle amounts with commas (e.g. "35,500 AED")
  const totalAmount = parseFloat(totalText.replace(/[^0-9.]/g, '').replace(',', ''));
  
  // Get user data
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const selectedProposal = JSON.parse(localStorage.getItem('selectedProposal')) || {};
  
  // Show processing state
  const button = document.getElementById('payment-button');
  if (button) {
    button.disabled = true;
    const spinner = button.querySelector('.spinner');
    if (spinner) spinner.style.display = 'inline-block';
    const buttonText = button.querySelector('.button-text');
    if (buttonText) buttonText.textContent = 'Processing...';
  }
  
  debug('Creating PayPal order with amount:', totalAmount);
  
  // Create PayPal order with proper error handling
  fetch('/api/create-paypal-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: totalAmount,
      currency: 'AED',
      description: `ZOLA - ${selectedProposal.recommendedFreeZone || 'Business Setup'} Package`,
      metadata: {
        customer_name: userData.fullName || '',
        customer_email: userData.email || '',
        proposal_id: selectedProposal.id || '',
        freezone: selectedProposal.recommendedFreeZone || ''
      }
    })
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => {
        throw new Error(`Server error (${response.status}): ${text}`);
      });
    }
    return response.json();
  })
  .then(data => {
    debug('PayPal order created:', data);
    
    if (data && data.id) {
      // Construct the PayPal checkout URL
      const environment = 'sandbox'; // Change to 'live' for production
      const paypalCheckoutUrl = environment === 'sandbox' 
        ? `https://www.sandbox.paypal.com/checkoutnow?token=${data.id}`
        : `https://www.paypal.com/checkoutnow?token=${data.id}`;
      
      debug('Redirecting to PayPal:', paypalCheckoutUrl);
      
      // Redirect the user to PayPal
      window.location.href = paypalCheckoutUrl;
    } else {
      throw new Error('Invalid PayPal order response: missing order ID');
    }
  })
  .catch(error => {
    console.error('PayPal redirect error:', error);
    
    // Reset button state
    if (button) {
      button.disabled = false;
      const spinner = button.querySelector('.spinner');
      if (spinner) spinner.style.display = 'none';
      const buttonText = button.querySelector('.button-text');
      if (buttonText) buttonText.textContent = 'Pay with PayPal';
    }
    
    // Show error
    alert(`PayPal Error: ${error.message}`);
  });
}

/**
 * Load Stripe script
 */
function loadStripeScript() {
  debug('Loading Stripe script');
  
  // Check if Stripe is already loaded
  if (typeof Stripe !== 'undefined') {
    debug('Stripe already loaded, initializing directly');
    initStripeWithPublishableKey();
    return;
  }
  
  // Fetch Stripe publishable key from server
  fetch('/api/stripe-config')
    .then(response => response.json())
    .then(data => {
      if (!data.publishableKey) {
        debug('Stripe publishable key not found');
        return;
      }
      
      // Initialize Stripe with the publishable key
      stripe = Stripe(data.publishableKey);
      debug('Stripe initialized successfully with key');
      
      // If card payment is currently selected, initialize it
      const selectedMethod = document.querySelector('.radio-button.selected')
                           ?.closest('.payment-method-header')
                           ?.getAttribute('data-method');
      if (selectedMethod === 'card') {
        initializeStripe();
      }
    })
    .catch(error => {
      debug('Error fetching Stripe config:', error);
      // For testing - use a test publishable key
      stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
      debug('Initialized Stripe with test key (fallback)');
    });
}

/**
 * Initialize Stripe with publishable key (for testing)
 */
function initStripeWithPublishableKey() {
  // Try to initialize with a test key
  try {
    stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
    debug('Initialized Stripe with test key');
    
    // Check if card payment is selected
    const selectedMethod = document.querySelector('.radio-button.selected')
                         ?.closest('.payment-method-header')
                         ?.getAttribute('data-method');
    if (selectedMethod === 'card') {
      initializeStripe();
    }
  } catch (error) {
    debug('Error initializing Stripe with test key:', error);
    // Continue without initializing Stripe
  }
}

/**
 * Initialize the payment gateway based on selected method
 */
function initializePaymentGateway(method) {
  debug('Initializing payment gateway for method:', method);
  
  switch (method) {
    case 'card':
      initializeStripe();
      break;
    case 'paypal':
      initializePayPal();
      break;
    case 'crypto':
      initializeCrypto();
      break;
    // Wire transfer doesn't need initialization
  }
}

/**
 * Process payment based on the selected method
 */
function processPaymentGateway(method) {
  debug('Processing payment with method:', method);
  
  // Get the total amount from the page
  const totalAmountElement = document.getElementById('total-amount');
  const totalText = totalAmountElement.textContent;
  const totalAmount = parseFloat(totalText.replace(/[^0-9.]/g, '').replace(',', ''));
  
  debug('Payment amount:', totalAmount);
  
  // Get the selected proposal and user data
  const selectedProposal = JSON.parse(localStorage.getItem('selectedProposal')) || {};
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  
  // Create metadata for payment
  const metadata = {
    customer_name: userData.fullName || '',
    customer_email: userData.email || '',
    customer_phone: userData.phoneNumber || '',
    proposal_id: selectedProposal.id || '',
    freezone: selectedProposal.recommendedFreeZone || ''
  };
  
  debug('Payment metadata:', metadata);
  
  switch (method) {
    case 'card':
      processStripePayment(totalAmount, metadata);
      break;
    case 'paypal':
      processPayPalPayment(totalAmount, metadata);
      break;
    case 'crypto':
      processCryptoPayment(totalAmount, metadata);
      break;
    case 'wire-transfer':
      processWireTransfer(totalAmount, metadata);
      break;
  }
}

/**
 * Show the payment success message
 */
function showPaymentSuccess(method, transactionId) {
  debug('Showing payment success message for method:', method);
  
  // Add a brief delay to ensure payment is processed server-side
  setTimeout(() => {
    // Check if we have a redirect URL for this payment
    fetch(`/api/payment-redirect?transaction_id=${transactionId}`)
      .then(response => response.json())
      .then(data => {
        // If we have a redirect URL to the client portal, redirect there
        if (data && data.redirect_url) {
          debug('Redirecting to client portal:', data.redirect_url);
          window.location.href = data.redirect_url;
          return;
        }
        
        // Otherwise, show the standard success message
        const paymentForm = document.getElementById('payment-form');
        const successMessage = document.getElementById('payment-success');
        
        if (paymentForm && successMessage) {
          paymentForm.style.display = 'none';
          successMessage.style.display = 'block';
          
          // Set the transaction ID
          const transactionElement = document.getElementById('transaction-id');
          if (transactionElement) {
            transactionElement.textContent = transactionId;
          }
        }
      })
      .catch(error => {
        debug('Error fetching redirect URL:', error);
        // Show standard success message as fallback
        const paymentForm = document.getElementById('payment-form');
        const successMessage = document.getElementById('payment-success');
        
        if (paymentForm && successMessage) {
          paymentForm.style.display = 'none';
          successMessage.style.display = 'block';
          
          // Set the transaction ID
          const transactionElement = document.getElementById('transaction-id');
          if (transactionElement) {
            transactionElement.textContent = transactionId;
          }
        }
      });
  }, 1500);
}

/**
 * Handle payment errors
 */
function handlePaymentError(method, error) {
  debug(`${method} payment error:`, error);
  
  // Display error message based on payment method
  let errorMessage = error.message || 'An error occurred with your payment.';
  
  switch (method) {
    case 'card':
      const cardErrors = document.getElementById('card-errors');
      if (cardErrors) {
        cardErrors.textContent = errorMessage;
      } else {
        alert(`Card Error: ${errorMessage}`);
      }
      break;
    case 'paypal':
      alert(`PayPal Error: ${errorMessage}`);
      break;
    case 'crypto':
      alert(`Crypto Payment Error: ${errorMessage}`);
      break;
    default:
      alert(`Payment Error: ${errorMessage}`);
  }
  
  // Reset button state
  setButtonProcessing(false);
}

//========================================
// STRIPE INTEGRATION (CARD PAYMENTS)
//========================================

/**
 * Initialize Stripe for card payments
 */
function initializeStripe() {
  debug('Initializing Stripe');
  
  // Make sure the card content is visible
  const cardContent = document.getElementById('card-content');
  if (cardContent) {
    cardContent.style.display = 'block';
    debug('Card content is now visible');
  }
  
  // Clear any previous error messages
  const cardErrors = document.getElementById('card-errors');
  if (cardErrors) {
    cardErrors.textContent = '';
  }
  
  // Check if Stripe Elements are already initialized
  if (stripeCardElement) {
    debug('Stripe Elements already initialized');
    return; // Already initialized
  }
  
  if (!stripe) {
    // If Stripe library isn't loaded yet, try loading it
    debug('Stripe not loaded yet, trying again');
    loadStripeScript();
    setTimeout(initializeStripe, 1000); // Retry after 1 second
    return;
  }
  
  // Create Stripe Elements
  stripeElements = stripe.elements();
  
  // Create card Element with specific styling for better visibility
  stripeCardElement = stripeElements.create('card', {
    style: {
      base: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '16px',
        color: '#333',
        '::placeholder': {
          color: '#aab7c4'
        },
        iconColor: '#555'
      },
      invalid: {
        color: '#dc3545',
        iconColor: '#dc3545'
      }
    },
    hidePostalCode: true // Hide postal code field if not needed
  });
  
  // Mount the card Element
  const stripeCardElementMount = document.getElementById('stripe-card-element');
  if (stripeCardElementMount) {
    debug('Found stripe-card-element, mounting card element');
    stripeCardElement.mount('#stripe-card-element');
    debug('Stripe card element mounted');
    
    // Handle real-time validation errors
    stripeCardElement.on('change', function(event) {
      const displayError = document.getElementById('card-errors');
      if (displayError) {
        if (event.error) {
          displayError.textContent = event.error.message;
        } else {
          displayError.textContent = '';
        }
      }
    });
  } else {
    debug('Error: #stripe-card-element not found in DOM');
  }
}

/**
 * Process payment with Stripe
 */
function processStripePayment(amount, metadata) {
  debug('Processing Stripe payment, amount:', amount);
  
  if (!stripe || !stripeCardElement) {
    handlePaymentError('card', { message: 'Payment system not initialized. Please try again.' });
    return;
  }
  
  const cardHolderName = document.getElementById('card-name').value;
  if (!cardHolderName) {
    document.getElementById('card-errors').textContent = 'Please enter the cardholder name.';
    setButtonProcessing(false);
    return;
  }
  
  // Set button to processing state
  setButtonProcessing(true);
  
  debug('Creating payment intent');
  
  // Create a payment intent on the server
  // For testing/demo purposes, we'll simulate this with a timeout
  setTimeout(() => {
    try {
      // Simulate payment process
      debug('Simulating payment process (no actual charge)');
      
      // Confirm card payment (this is a mock/simulation)
      debug('Simulating card payment confirmation');
      
      // Show success to user
      showPaymentSuccess('Card', 'DEMO-' + Date.now());
    } catch (error) {
      debug('Error in Stripe payment process simulation:', error);
      handlePaymentError('card', error);
    }
  }, 2000);
  
  // In production, you would use actual server call:
  /*
  fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount,
      currency: 'aed',
      metadata: metadata
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    debug('Payment intent created:', data);
    currentPaymentIntent = data.paymentIntentId;
    
    // Confirm card payment
    debug('Confirming card payment');
    return stripe.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: stripeCardElement,
        billing_details: {
          name: cardHolderName,
          email: metadata.customer_email
        }
      }
    });
  })
  .then(result => {
    debug('Card payment confirmation result:', result);
    
    if (result.error) {
      // Show error to your customer
      handlePaymentError('card', result.error);
    } else {
      if (result.paymentIntent.status === 'succeeded') {
        // Payment succeeded
        debug('Payment succeeded');
        showPaymentSuccess('Card', result.paymentIntent.id);
      } else {
        // Payment requires additional action or failed
        debug('Payment did not succeed, status:', result.paymentIntent.status);
        handlePaymentError('card', { message: 'Payment processing failed. Please try again.' });
      }
    }
  })
  .catch(error => {
    debug('Error in Stripe payment process:', error);
    handlePaymentError('card', error);
  });
  */
}

//========================================
// PAYPAL INTEGRATION
//========================================

/**
 * Initialize PayPal
 */
function initializePayPal() {
  debug('Initializing PayPal');
  
  if (paypalInitialized) {
    debug('PayPal already initialized');
    return; // Already initialized
  }
  
  // Get amount from the page
  const totalAmountElement = document.getElementById('total-amount');
  const totalText = totalAmountElement.textContent;
  const amount = parseFloat(totalText.replace(/[^0-9.]/g, '').replace(',', ''));
  
  debug('PayPal amount:', amount);
  
  // Clear any existing PayPal buttons
  const paypalContainer = document.getElementById('paypal-button-container');
  if (!paypalContainer) {
    debug('Error: #paypal-button-container not found in DOM');
    return;
  }
  
  paypalContainer.innerHTML = '<div class="spinner" style="display:inline-block;margin:20px auto;"></div>';
  
  debug('Fetching PayPal config');
  
  // Fetch PayPal client ID from server
  fetch('/api/paypal-config')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data.clientId) {
        throw new Error('PayPal client ID not found');
      }
      
      debug('PayPal config received:', data);
      
      // Load the PayPal JS SDK
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${data.clientId}&currency=AED`;
      script.async = true;
      
      script.onload = function() {
        debug('PayPal SDK loaded');
        
        // Clear the loading spinner
        paypalContainer.innerHTML = '';
        
        // Create PayPal button
        paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'pay'
          },
          
          // Called when the button is created
          createOrder: function(data, actions) {
            debug('PayPal createOrder called');
            
            const selectedProposal = JSON.parse(localStorage.getItem('selectedProposal')) || {};
            const userData = JSON.parse(localStorage.getItem('userData')) || {};
            
            return fetch('/api/create-paypal-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                amount: amount,
                currency: 'AED',
                description: `ZOLA - ${selectedProposal.recommendedFreeZone || 'Business Setup'} Package`,
                metadata: {
                  customer_name: userData.fullName || '',
                  customer_email: userData.email || '',
                  proposal_id: selectedProposal.id || '',
                  freezone: selectedProposal.recommendedFreeZone || ''
                }
              })
            })
            .then(function(res) {
              if (!res.ok) {
                return res.text().then(text => {
                  throw new Error(`Server error (${res.status}): ${text}`);
                });
              }
              return res.json();
            })
            .then(function(orderData) {
              debug('PayPal order created:', orderData);
              return orderData.id;
            });
          },
          
          // Called when the payment is approved
          onApprove: function(data, actions) {
            debug('PayPal payment approved:', data);
            setButtonProcessing(true);
            
            return fetch('/api/capture-paypal-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                orderId: data.orderID
              })
            })
            .then(function(res) {
              if (!res.ok) {
                return res.text().then(text => {
                  throw new Error(`Server error (${res.status}): ${text}`);
                });
              }
              return res.json();
            })
            .then(function(orderData) {
              // Transaction completed successfully
              debug('PayPal payment captured:', orderData);
              const transaction = orderData.purchase_units[0].payments.captures[0];
              showPaymentSuccess('PayPal', transaction.id);
            })
            .catch(function(error) {
              debug('Error capturing PayPal payment:', error);
              handlePaymentError('paypal', error);
            });
          },
          
          // Called when there's an error
          onError: function(err) {
            debug('PayPal button error:', err);
            handlePaymentError('paypal', err);
          }
        }).render('#paypal-button-container');
        
        debug('PayPal buttons rendered');
        paypalInitialized = true;
      };
      
      script.onerror = function() {
        debug('Failed to load PayPal SDK');
        paypalContainer.innerHTML = '<p class="text-danger">Could not load PayPal. Please try another payment method.</p>';
      };
      
      document.body.appendChild(script);
    })
    .catch(error => {
      debug('Error initializing PayPal:', error);
      const paypalContainer = document.getElementById('paypal-button-container');
      paypalContainer.innerHTML = '<p class="text-danger">Could not initialize PayPal. Please try another payment method.</p>';
    });
}

/**
 * Process PayPal payment
 */
function processPayPalPayment(amount, metadata) {
  debug('Processing PayPal payment, amount:', amount);
  
  // Use the fixed direct PayPal redirect function
  directPayPalRedirect();
}

//========================================
// COINBASE COMMERCE (CRYPTO PAYMENTS)
//========================================

/**
 * Initialize Coinbase Commerce for crypto payments
 */
function initializeCrypto() {
  debug('Initializing Crypto payments');
  
  if (cryptoInitialized) {
    debug('Crypto already initialized');
    return; // Already initialized
  }
  
  // Get the selected cryptocurrency
  const cryptoCurrencyElement = document.getElementById('crypto-currency');
  if (!cryptoCurrencyElement) {
    debug('Error: #crypto-currency not found in DOM');
    return;
  }
  
  const cryptoCurrency = cryptoCurrencyElement.value;
  
  // Get amount from the page
  const totalAmountElement = document.getElementById('total-amount');
  const totalText = totalAmountElement.textContent;
  const amount = parseFloat(totalText.replace(/[^0-9.]/g, '').replace(',', ''));
  
  debug('Crypto amount:', amount, 'currency:', cryptoCurrency);
  
  // Clear previous button
  const cryptoButton = document.getElementById('crypto-checkout-button');
  if (!cryptoButton) {
    debug('Error: #crypto-checkout-button not found in DOM');
    return;
  }
  
  cryptoButton.innerHTML = '';
  
  // Create checkout button
  const checkoutButton = document.createElement('button');
  checkoutButton.className = 'payment-button';
  checkoutButton.innerText = `Pay with ${cryptoCurrency.toUpperCase()}`;
  
  cryptoButton.appendChild(checkoutButton);
  
  // Add event listener
  checkoutButton.addEventListener('click', function() {
    processCryptoPayment();
  });
  
  cryptoInitialized = true;
  
  // Add listener for currency change
  document.getElementById('crypto-currency').addEventListener('change', function() {
    debug('Crypto currency changed');
    initializeCrypto(); // Reinitialize with new currency
  });
}

/**
 * Process Coinbase Commerce payment
 */
function processCryptoPayment() {
  debug('Processing Crypto payment');
  
  setButtonProcessing(true);
  
  // Get the selected cryptocurrency
  const cryptoCurrency = document.getElementById('crypto-currency').value;
  
  // Get amount from the page
  const totalAmountElement = document.getElementById('total-amount');
  const totalText = totalAmountElement.textContent;
  const amount = parseFloat(totalText.replace(/[^0-9.]/g, '').replace(',', ''));
  
  // Get the selected proposal and user data
  const selectedProposal = JSON.parse(localStorage.getItem('selectedProposal')) || {};
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  
  debug('Creating crypto charge, amount:', amount, 'currency:', cryptoCurrency);
  
  // For testing, we'll simulate a crypto payment success
  setTimeout(() => {
    debug('Simulating crypto payment completion');
    showPaymentSuccess('Crypto', 'DEMO-CRYPTO-' + Date.now());
  }, 2000);

  // In production, you would use actual server call:
  /*
  // Create a charge through the server
  fetch('/api/create-crypto-charge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount,
      currency: 'AED',
      name: `ZOLA - ${selectedProposal.recommendedFreeZone || 'Business Setup'} Package`,
      description: 'Payment for business setup services',
      metadata: {
        customer_name: userData.fullName || '',
        customer_email: userData.email || '',
        proposal_id: selectedProposal.id || '',
        freezone: selectedProposal.recommendedFreeZone || ''
      },
      preferred_currency: cryptoCurrency
    })
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => {
        throw new Error(`Server error (${response.status}): ${text}`);
      });
    }
    return response.json();
  })
  .then(data => {
    debug('Crypto charge created:', data);
    
    // Open Coinbase Commerce checkout in a new window
    const checkoutWindow = window.open(data.hosted_url, '_blank');
    
    // Start polling for payment status
    pollCryptoPaymentStatus(data.code);
    
    // Reset button state if window closed or blocked
    if (!checkoutWindow || checkoutWindow.closed || typeof checkoutWindow.closed == 'undefined') {
      setButtonProcessing(false);
      alert('Please allow pop-ups to open the crypto payment window.');
    }
  })
  .catch(error => {
    debug('Error in Crypto payment process:', error);
    handlePaymentError('crypto', error);
  });
  */
}

/**
 * Poll for crypto payment status
 */
function pollCryptoPaymentStatus(chargeCode) {
  debug('Polling for crypto payment status, charge code:', chargeCode);
  
  const statusCheck = setInterval(() => {
    fetch(`/api/check-crypto-payment/${chargeCode}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        debug('Crypto payment status check result:', data);
        
        if (data.status === 'COMPLETED' || data.status === 'CONFIRMED' || data.status === 'RESOLVED') {
          debug('Crypto payment completed');
          clearInterval(statusCheck);
          showPaymentSuccess('Crypto', chargeCode);
        } else if (data.status === 'EXPIRED' || data.status === 'CANCELED') {
          debug('Crypto payment canceled or expired');
          clearInterval(statusCheck);
          handlePaymentError('crypto', { message: 'Crypto payment was canceled or expired.' });
        }
      })
      .catch(error => {
        debug('Error checking crypto payment status:', error);
      });
  }, 5000); // Check every 5 seconds
  
  // Stop checking after 30 minutes (to prevent endless polling)
  setTimeout(() => {
    debug('Stopping crypto payment status polling (timeout)');
    clearInterval(statusCheck);
    // Only show error if we're still on the payment page
    if (document.getElementById('payment-button')) {
      handlePaymentError('crypto', { message: 'Payment timeout. Please check your Coinbase account for the status of this transaction.' });
    }
  }, 30 * 60 * 1000);
}

//========================================
// WIRE TRANSFER
//========================================

/**
 * Process wire transfer (manual method)
 */
function processWireTransfer(amount, metadata) {
  debug('Processing Wire Transfer, amount:', amount);
  
  // Set button to processing state
  setButtonProcessing(true);
  
  // For testing, we'll simulate a wire transfer record
  setTimeout(() => {
    debug('Simulating wire transfer processing');
    showPaymentSuccess('Wire Transfer', 'DEMO-WT-' + Date.now());
  }, 1500);

  // In production, you would use actual server call:
  /*
  // Create a record in the database
  fetch('/api/record-wire-transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount,
      currency: 'AED',
      metadata: metadata
    })
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => {
        throw new Error(`Server error (${response.status}): ${text}`);
      });
    }
    return response.json();
  })
  .then(data => {
    debug('Wire transfer recorded:', data);
    // Show success message
    showPaymentSuccess('Wire Transfer', data.referenceNumber);
  })
  .catch(error => {
    debug('Error recording wire transfer:', error);
    alert('Please note the bank details and make your transfer. We will confirm your payment once received.');
    setButtonProcessing(false);
  });
  */
}

/**
 * Set button to processing state
 */
function setButtonProcessing(isProcessing) {
  const button = document.getElementById('payment-button');
  if (!button) {
    debug('Error: #payment-button not found in DOM');
    return;
  }
  
  if (isProcessing) {
    debug('Setting button to processing state');
    button.classList.add('processing');
    button.disabled = true;
    
    const spinner = button.querySelector('.spinner');
    if (spinner) {
      spinner.style.display = 'inline-block';
    }
    
    const buttonText = button.querySelector('.button-text');
    if (buttonText) {
      buttonText.textContent = 'Processing...';
    }
  } else {
    debug('Resetting button state');
    button.classList.remove('processing');
    button.disabled = false;
    
    const spinner = button.querySelector('.spinner');
    if (spinner) {
      spinner.style.display = 'none';
    }
    
    // Reset button text based on selected payment method
    const selectedMethod = document.querySelector('.radio-button.selected')
                          ?.closest('.payment-method-header')
                          ?.getAttribute('data-method');
                          
    if (selectedMethod) {
      updatePaymentButtonText(selectedMethod);
    }
  }
}

/**
 * Update payment button text based on selected payment method
 */
function updatePaymentButtonText(method) {
  debug('Updating button text for method:', method);
  
  const buttonText = document.querySelector('.payment-button .button-text');
  if (!buttonText) {
    debug('Error: .payment-button .button-text not found in DOM');
    return;
  }
  
  switch (method) {
    case 'wire-transfer':
      buttonText.textContent = 'Confirm Wire Transfer';
      break;
    case 'card':
      buttonText.textContent = 'Pay with Card';
      break;
    case 'paypal':
      buttonText.textContent = 'Pay with PayPal';
      break;
    case 'crypto':
      buttonText.textContent = 'Pay with Crypto';
      break;
    default:
      buttonText.textContent = 'Proceed to Payment';
  }
}

// Add a CSS animation for the spinner
document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s linear infinite;
      margin-right: 10px;
      display: none;
    }
  `;
  document.head.appendChild(style);
});

// Export functions for direct access if needed
window.directPayPalRedirect = directPayPalRedirect;
window.processPaymentGateway = processPaymentGateway;
window.initializePaymentGateway = initializePaymentGateway;