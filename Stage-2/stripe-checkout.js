/**
 * Stripe Checkout Integration for ZOLA
 * This file implements Stripe Payment Element for a modern checkout experience
 */

let stripe;
let elements;
let paymentElement;
let emailAddress = '';

// Main initialization function
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Stripe checkout...');
  
  // Initialize Stripe
  initializeStripe();
  
  // Handle payment form submission
  const submitButton = document.getElementById('submit-button');
  if (submitButton) {
    submitButton.addEventListener('click', handleSubmit);
  }
});

// Initialize Stripe with API key
async function initializeStripe() {
  try {
    // Fetch the publishable key from the server
    const response = await fetch('/api/stripe-config');
    const { publishableKey } = await response.json();
    
    if (!publishableKey) {
      throw new Error('No publishable key returned from server');
    }
    
    // Initialize Stripe
    stripe = Stripe(publishableKey);
    console.log('Stripe initialized with publishable key');
    
    // Create payment intent and setup Payment Element
    createPaymentIntent();
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    showMessage('Could not load payment system. Please try again later.');
    
    // Disable the payment button
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
      submitButton.disabled = true;
    }
  }
}

// Create a payment intent and set up Payment Element
async function createPaymentIntent() {
  setLoading(true);
  
  try {
    // Get payment details for the intent
    const amount = getPaymentAmount();
    const metadata = getPaymentMetadata();
    
    // Create payment intent
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount,
        currency: 'aed',
        metadata: metadata
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    const { clientSecret } = data;
    
    if (!clientSecret) {
      throw new Error('No client secret returned from server');
    }
    
    // Setup Payment Element with client secret
    setupPaymentElement(clientSecret);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    showMessage('Error setting up payment system. Please try again later.');
  } finally {
    setLoading(false);
  }
}

// Set up Payment Element with client secret
function setupPaymentElement(clientSecret) {
  // Define appearance for Payment Element
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#635bff',
      colorBackground: '#ffffff',
      colorText: '#333333',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px'
    }
  };
  
  // Initialize Elements
  elements = stripe.elements({
    clientSecret,
    appearance
  });
  
  // Create and mount Payment Element
  paymentElement = elements.create('payment', {
    layout: 'tabs',
    defaultValues: {
      billingDetails: {
        name: document.getElementById('name')?.value || '',
        email: document.getElementById('email')?.value || ''
      }
    }
  });
  
  // Mount Payment Element
  paymentElement.mount('#payment-element');
  
  // Update the form if user changes their details
  document.getElementById('email')?.addEventListener('change', (e) => {
    emailAddress = e.target.value;
  });
  
  // Show the form now that it's ready
  setLoading(false);
}

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();
  
  // Validate form fields
  const name = document.getElementById('name')?.value;
  const email = document.getElementById('email')?.value || emailAddress;
  
  if (!name || !email) {
    showMessage('Please fill in all required fields.');
    return;
  }
  
  setLoading(true);
  
  try {
    // Confirm payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
        payment_method_data: {
          billing_details: { name, email }
        },
        receipt_email: email
      },
      redirect: "if_required"
    });
    
    // Handle payment result
    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        showMessage(error.message);
      } else {
        showMessage('An unexpected error occurred.');
        console.error('Payment error:', error);
      }
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded
      showPaymentSuccess(paymentIntent.id);
    } else if (paymentIntent) {
      // Handle other statuses
      if (paymentIntent.status === 'processing') {
        showMessage('Your payment is processing. We will update you when payment is received.');
      } else if (paymentIntent.status === 'requires_payment_method') {
        showMessage('Your payment was not successful, please try again.');
      } else {
        showMessage(`Payment status: ${paymentIntent.status}. Please try again.`);
      }
      setLoading(false);
    }
  } catch (error) {
    console.error('Error during payment confirmation:', error);
    showMessage('An error occurred. Please try again later.');
    setLoading(false);
  }
}

// Show payment success message
function showPaymentSuccess(transactionId) {
  // Create success message container
  const paymentOptions = document.querySelector('.payment-options');
  if (!paymentOptions) return;
  
  paymentOptions.innerHTML = `
    <div class="payment-success">
      <div class="success-icon">✓</div>
      <h3>Payment Successful!</h3>
      <p>Your payment has been processed successfully.</p>
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

// Show error message
function showMessage(message) {
  const messageElement = document.getElementById('payment-message');
  if (messageElement) {
    messageElement.textContent = message;
    
    // Auto-hide the message after 8 seconds
    setTimeout(() => {
      messageElement.textContent = '';
    }, 8000);
  }
}

// Set loading state
function setLoading(isLoading) {
  const submitButton = document.getElementById('submit-button');
  const spinner = submitButton?.querySelector('.spinner');
  const buttonText = submitButton?.querySelector('.button-text');
  
  if (submitButton) {
    submitButton.disabled = isLoading;
  }
  
  if (spinner) {
    spinner.style.display = isLoading ? 'inline-block' : 'none';
  }
  
  if (buttonText) {
    buttonText.textContent = isLoading ? 'Processing...' : 'Pay now';
  }
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

// Get payment metadata
function getPaymentMetadata() {
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const selectedProposal = JSON.parse(localStorage.getItem('selectedProposal')) || {};
  
  return {
    customer_name: userData.fullName || document.getElementById('name')?.value || '',
    customer_email: userData.email || document.getElementById('email')?.value || '',
    customer_phone: userData.phoneNumber || '',
    proposal_id: selectedProposal.id || '',
    freezone: selectedProposal.recommendedFreeZone || '',
    payment_method: 'card'
  };
}