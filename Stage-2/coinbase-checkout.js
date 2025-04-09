/**
 * Coinbase Commerce Integration for ZOLA
 * This file implements Coinbase Commerce for cryptocurrency payments
 */

let coinbaseInitialized = false;
let coinbaseCheckoutButtonRendered = false;

// Initialize Coinbase Commerce when the crypto payment method is selected
function initializeCoinbaseCommerce() {
  if (coinbaseInitialized) {
    return; // Already initialized
  }

  console.log('Initializing Coinbase Commerce');
  
  // Get the container for the Coinbase button
  const buttonContainer = document.getElementById('coinbase-button-container');
  if (!buttonContainer) {
    console.error('Coinbase button container not found');
    return;
  }
  
  // Show loading state
  buttonContainer.innerHTML = '<div class="text-center"><div class="spinner" style="display:inline-block;margin:20px auto;"></div><p>Loading payment options...</p></div>';
  
  // Load the Coinbase Commerce SDK
  const script = document.createElement('script');
  script.src = 'https://commerce.coinbase.com/v1/checkout.js';
  script.async = true;
  
  script.onload = function() {
    console.log('Coinbase Commerce SDK loaded');
    coinbaseInitialized = true;
    
    // Clear loading state
    buttonContainer.innerHTML = '';
    
    // Get the selected cryptocurrency and payment details
    createCoinbaseCheckoutButton();
  };
  
  script.onerror = function(error) {
    console.error('Failed to load Coinbase Commerce SDK:', error);
    buttonContainer.innerHTML = '<p class="text-danger">Could not load cryptocurrency payment option. Please try another payment method.</p>';
  };
  
  document.body.appendChild(script);
  
  // Add listener for currency change to update the checkout button
  document.getElementById('crypto-currency').addEventListener('change', function() {
    if (coinbaseInitialized) {
      createCoinbaseCheckoutButton();
    }
  });
}

// Create the Coinbase Commerce checkout button
function createCoinbaseCheckoutButton() {
  // Get payment details
  const amount = getPaymentAmount();
  const cryptoCurrency = document.getElementById('crypto-currency').value;
  
  // Get user data from form or localStorage
  const cryptoName = document.getElementById('crypto-name').value;
  const cryptoEmail = document.getElementById('crypto-email').value;
  
  // Validate input fields
  if (!cryptoName || !cryptoEmail) {
    // Don't show validation error until user tries to pay
    console.log('Name or email missing, but not showing error yet');
    renderCheckoutButton(amount, cryptoCurrency);
    return;
  }
  
  // If we have all data, re-render the checkout button
  renderCheckoutButton(amount, cryptoCurrency);
}

// Render the Coinbase Commerce checkout button
function renderCheckoutButton(amount, cryptoCurrency) {
  const buttonContainer = document.getElementById('coinbase-button-container');
  if (!buttonContainer) return;
  
  // Clear existing button
  buttonContainer.innerHTML = '';
  
  // Get the proposal and user data for metadata
  const selectedProposal = JSON.parse(localStorage.getItem('selectedProposal')) || {};
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  
  // Create checkout button options
  const checkoutOptions = {
    buttonId: 'coinbase-commerce-button',
    styled: true,
    custom: 'zola-checkout',
    checkout: {
      amount: amount,
      currencyCode: 'AED',
      redirectTo: window.location.origin + '/payment-success',
      crypto: cryptoCurrency,
      cancelUrl: window.location.href,
      customerInfo: {
        name: document.getElementById('crypto-name').value || userData.fullName || '',
        email: document.getElementById('crypto-email').value || userData.email || ''
      },
      metadata: {
        customer_name: document.getElementById('crypto-name').value || userData.fullName || '',
        customer_email: document.getElementById('crypto-email').value || userData.email || '',
        proposal_id: selectedProposal.id || '',
        freezone: selectedProposal.recommendedFreeZone || ''
      }
    },
    onModalClose: function() {
      console.log('Coinbase Commerce modal closed');
    }
  };
  
  // Create a button element
  const button = document.createElement('button');
  button.id = 'crypto-payment-button';
  button.className = 'payment-button';
  button.innerHTML = `<span>Pay with ${cryptoCurrency}</span>`;
  buttonContainer.appendChild(button);
  
  // Add event listener to the button
  button.addEventListener('click', function() {
    // Validate form fields before creating charge
    const name = document.getElementById('crypto-name').value;
    const email = document.getElementById('crypto-email').value;
    
    if (!name || !email) {
      document.getElementById('crypto-payment-message').textContent = 'Please fill in your name and email.';
      return;
    }
    
    // Clear any error messages
    document.getElementById('crypto-payment-message').textContent = '';
    
    // Set button to loading state
    button.disabled = true;
    button.innerHTML = '<span class="spinner" style="display:inline-block;"></span> Processing...';
    
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
          customer_name: name,
          customer_email: email,
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
      console.log('Crypto charge created:', data);
      
      // Open Coinbase Commerce checkout in a new window
      window.open(data.hosted_url, '_blank');
      
      // Start polling for payment status
      pollCryptoPaymentStatus(data.code);
      
      // Reset button state
      button.disabled = false;
      button.innerHTML = `<span>Pay with ${cryptoCurrency}</span>`;
    })
    .catch(error => {
      console.error('Error creating crypto charge:', error);
      document.getElementById('crypto-payment-message').textContent = error.message || 'An error occurred. Please try again.';
      
      // Reset button state
      button.disabled = false;
      button.innerHTML = `<span>Pay with ${cryptoCurrency}</span>`;
    });
  });
  
  coinbaseCheckoutButtonRendered = true;
}

// Poll for crypto payment status
function pollCryptoPaymentStatus(chargeCode) {
  console.log('Polling for crypto payment status, charge code:', chargeCode);
  
  const statusCheck = setInterval(() => {
    fetch(`/api/check-crypto-payment/${chargeCode}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Crypto payment status check result:', data);
        
        if (data.status === 'COMPLETED' || data.status === 'CONFIRMED' || data.status === 'RESOLVED') {
          console.log('Crypto payment completed');
          clearInterval(statusCheck);
          showPaymentSuccess('Crypto', chargeCode);
        } else if (data.status === 'EXPIRED' || data.status === 'CANCELED') {
          console.log('Crypto payment canceled or expired');
          clearInterval(statusCheck);
          document.getElementById('crypto-payment-message').textContent = 'Crypto payment was canceled or expired.';
        }
      })
      .catch(error => {
        console.error('Error checking crypto payment status:', error);
      });
  }, 5000); // Check every 5 seconds
  
  // Stop checking after 30 minutes (to prevent endless polling)
  setTimeout(() => {
    console.log('Stopping crypto payment status polling (timeout)');
    clearInterval(statusCheck);
  }, 30 * 60 * 1000);
}

// Show payment success message
function showPaymentSuccess(method, transactionId) {
  // Create success message container
  const paymentOptions = document.querySelector('.payment-options');
  if (!paymentOptions) return;
  
  paymentOptions.innerHTML = `
    <div class="payment-success">
      <div class="success-icon">✓</div>
      <h3>Payment Successful!</h3>
      <p>Your payment via ${method} has been processed successfully.</p>
      <p>Transaction ID: ${transactionId}</p>
      <p>We've sent a confirmation email with further details.</p>
      <button id="continue-button" class="payment-button">Continue</button>
    </div>
  `;
  
  // Add event listener to continue button
  document.getElementById('continue-button').addEventListener('click', function() {
    window.location.href = '/'; // Redirect to home page
  });
}

// Get payment amount from the page
function getPaymentAmount() {
  const totalAmountElement = document.getElementById('total-amount');
  if (!totalAmountElement) {
    console.error('Total amount element not found');
    return 0;
  }
  
  const totalText = totalAmountElement.textContent;
  // Extract the number from the text (remove non-numeric chars except '.')
  return parseFloat(totalText.replace(/[^0-9.]/g, '').replace(',', ''));
}

// Expose the initialization function to be called from the main script
window.initializeCoinbaseCommerce = initializeCoinbaseCommerce;