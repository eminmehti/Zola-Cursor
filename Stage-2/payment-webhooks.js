/**
 * ZOLA Payment Webhooks
 * 
 * This file handles payment webhook callbacks from:
 * - Stripe
 * - PayPal
 * - Coinbase Commerce
 */

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Add Firebase integration for client portal connection
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Set up middleware for Stripe webhooks (raw body is needed for signature verification)
const stripeWebhookMiddleware = bodyParser.raw({ type: 'application/json' });

// Database connection
const db = new sqlite3.Database('./mydb.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database for webhooks.');
  }
});

// Initialize Firebase Admin SDK
let firestoreDb;
try {
  // Initialize Firebase Admin with service account or environment variables
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || "zola-client-portal",
    // If using service account credentials, load them here
    // credential: cert(require('./service-account.json')),
    // Otherwise, rely on application default credentials or environment variables
  };
  
  const firebaseApp = initializeApp(firebaseConfig, 'zola-payment-webhook');
  firestoreDb = getFirestore(firebaseApp);
  console.log('Firebase Admin SDK initialized for client portal integration');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

/**
 * Stripe webhook handler
 */
router.post('/stripe', stripeWebhookMiddleware, async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    // Verify the event came from Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await updatePaymentStatus(paymentIntent.id, 'COMPLETED');
      
      // Send email notification
      await sendPaymentConfirmationEmail(paymentIntent);
      
      console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
      break;
      
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      await updatePaymentStatus(failedPaymentIntent.id, 'FAILED');
      console.log(`❌ Payment failed: ${failedPaymentIntent.id}`);
      break;
      
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }
  
  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
});

/**
 * PayPal webhook handler
 */
router.post('/paypal', bodyParser.json(), async (req, res) => {
  const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID;
  const headers = req.headers;
  
  try {
    // Verify the webhook signature
    const isValid = verifyPayPalWebhook(req.body, headers, paypalWebhookId);
    
    if (!isValid) {
      console.error('PayPal webhook signature verification failed');
      return res.status(400).send('Webhook signature verification failed');
    }
    
    const event = req.body;
    
    // Handle different event types
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        const orderId = event.resource.supplementary_data.related_ids.order_id;
        await updatePaymentStatus(orderId, 'COMPLETED');
        
        // Send email notification
        await sendPaymentConfirmationEmail({
          id: orderId,
          amount: event.resource.amount.value,
          metadata: JSON.parse(event.resource.custom_id || '{}')
        });
        
        console.log(`💰 PayPal payment completed: ${orderId}`);
        break;
        
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REVERSED':
        const failedOrderId = event.resource.supplementary_data.related_ids.order_id;
        await updatePaymentStatus(failedOrderId, 'FAILED');
        console.log(`❌ PayPal payment failed: ${failedOrderId}`);
        break;
        
      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`);
    }
    
    // Return a success response
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * Coinbase Commerce webhook handler
 */
router.post('/coinbase', bodyParser.json(), async (req, res) => {
  const signature = req.headers['x-cc-webhook-signature'];
  const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  
  try {
    // Verify the signature
    const isValid = verifyCoinbaseSignature(req.body, signature, webhookSecret);
    
    if (!isValid) {
      console.error('Coinbase Commerce webhook signature verification failed');
      return res.status(400).send('Webhook signature verification failed');
    }
    
    const event = req.body;
    
    // Handle the event
    switch (event.type) {
      case 'charge:confirmed':
      case 'charge:resolved':
        const chargeCode = event.data.code;
        await updatePaymentStatus(chargeCode, 'COMPLETED');
        
        // Send email notification
        await sendPaymentConfirmationEmail({
          id: chargeCode,
          amount: event.data.pricing.local.amount,
          metadata: event.data.metadata
        });
        
        console.log(`💰 Crypto payment completed: ${chargeCode}`);
        break;
        
      case 'charge:failed':
      case 'charge:canceled':
        const failedChargeCode = event.data.code;
        await updatePaymentStatus(failedChargeCode, 'FAILED');
        console.log(`❌ Crypto payment failed: ${failedChargeCode}`);
        break;
        
      default:
        console.log(`Unhandled Coinbase event type: ${event.type}`);
    }
    
    // Return a success response
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Coinbase webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * Update payment status in the database and create case in client portal
 */
async function updatePaymentStatus(paymentId, status, paymentData = {}) {
  // Update payment in SQLite database
  return new Promise(async (resolve, reject) => {
    db.run(
      'UPDATE payments SET status = ? WHERE payment_id = ?',
      [status, paymentId],
      async function(err) {
        if (err) {
          console.error('Error updating payment status:', err);
          reject(err);
        } else {
          console.log(`Payment ${paymentId} status updated to ${status}`);
          
          // If payment is completed, create a case in the client portal
          if (status === 'COMPLETED') {
            try {
              await createClientPortalCase(paymentId, paymentData);
            } catch (error) {
              console.error('Error creating client portal case:', error);
            }
          }
          
          resolve();
        }
      }
    );
  });
}

/**
 * Create a new case in the client portal Firebase
 */
async function createClientPortalCase(paymentId, paymentData) {
  if (!firestoreDb) {
    console.error('Firebase Firestore not initialized, cannot create case');
    return;
  }

  try {
    // Get proposal details from the database
    const proposalData = await getProposalDataForPayment(paymentId, paymentData);
    
    if (!proposalData) {
      console.error('No proposal data found for payment', paymentId);
      return;
    }
    
    // Generate a case number
    const caseNumber = generateCaseNumber();
    
    // Create the case in Firestore
    const caseData = {
      caseNumber,
      title: `${proposalData.businessName || 'New Business'} Formation`,
      type: 'BUSINESS_FORMATION',
      status: 'NEW',
      description: `Formation of ${proposalData.businessName} in ${proposalData.freezone || 'UAE'}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalAmount: proposalData.amount || 0,
      remainingAmount: 0,
      clientId: proposalData.userId || 'new-user',
      accountName: proposalData.businessName || 'New Business',
      proposalName: proposalData.freezone ? `${proposalData.freezone} Business Setup` : 'Business Formation',
      paymentId: paymentId,
      // Add reference to the original proposal
      proposalId: proposalData.proposalId,
      // Email for user creation/association
      clientEmail: proposalData.email,
      // Add additional proposal details
      proposalDetails: proposalData
    };
    
    // Add the case to Firestore
    const caseRef = await firestoreDb.collection('cases').add(caseData);
    console.log(`Created client portal case: ${caseRef.id} with case number ${caseNumber}`);
    
    // Store the redirect URL in the database for frontend to use
    const redirectUrl = `${process.env.CLIENT_PORTAL_URL || 'http://localhost:5173'}/case/${caseRef.id}`;
    
    db.run(
      'UPDATE payments SET redirect_url = ? WHERE payment_id = ?',
      [redirectUrl, paymentId],
      function(err) {
        if (err) {
          console.error('Error updating payment redirect URL:', err);
        } else {
          console.log(`Updated payment ${paymentId} with redirect URL: ${redirectUrl}`);
        }
      }
    );
    
    return caseRef.id;
  } catch (error) {
    console.error('Error creating case in client portal:', error);
    throw error;
  }
}

/**
 * Generate a unique case number
 */
function generateCaseNumber() {
  const date = new Date();
  const year = date.getFullYear();
  // Generate random 6-digit number
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ZG-${year}-${random}`;
}

/**
 * Get proposal data for a payment
 */
async function getProposalDataForPayment(paymentId, paymentData = {}) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT p.*, u.email, u.full_name 
       FROM payments p 
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.payment_id = ?`,
      [paymentId],
      async (err, payment) => {
        if (err) {
          console.error('Error fetching payment data:', err);
          reject(err);
          return;
        }
        
        if (!payment) {
          // Try to use paymentData if available
          if (paymentData.metadata) {
            resolve({
              businessName: paymentData.metadata.business_name || 'New Business',
              freezone: paymentData.metadata.freezone || null,
              amount: paymentData.amount || 0,
              email: paymentData.metadata.customer_email || null,
              userId: paymentData.metadata.user_id || null,
              proposalId: paymentData.metadata.proposal_id || null
            });
            return;
          }
          
          console.log('No payment found with ID:', paymentId);
          resolve(null);
          return;
        }
        
        // If we have a proposal ID, get the proposal details
        if (payment.proposal_id) {
          db.get(
            'SELECT * FROM proposals WHERE id = ?',
            [payment.proposal_id],
            (err, proposal) => {
              if (err || !proposal) {
                console.log('No proposal found for payment:', paymentId);
                // Return basic payment info
                resolve({
                  businessName: payment.description || 'New Business',
                  freezone: null,
                  amount: payment.amount,
                  email: payment.email,
                  userId: payment.user_id,
                  proposalId: payment.proposal_id
                });
                return;
              }
              
              // Return full proposal data
              resolve({
                businessName: proposal.business_name || payment.description || 'New Business',
                freezone: proposal.recommended_freezone,
                amount: payment.amount,
                email: payment.email,
                userId: payment.user_id,
                proposalId: payment.proposal_id,
                // Add more proposal details as needed
                activities: proposal.activities,
                visas: proposal.visa_count
              });
            }
          );
        } else {
          // No proposal ID, return basic payment info
          resolve({
            businessName: payment.description || 'New Business',
            freezone: null,
            amount: payment.amount,
            email: payment.email,
            userId: payment.user_id,
            proposalId: null
          });
        }
      }
    );
  });
}

/**
 * Send payment confirmation email with client portal link
 */
async function sendPaymentConfirmationEmail(payment) {
  // Get the redirect URL if available
  let redirectUrl = null;
  
  try {
    const result = await new Promise((resolve, reject) => {
      db.get(
        'SELECT redirect_url FROM payments WHERE payment_id = ?',
        [payment.id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
    
    if (result && result.redirect_url) {
      redirectUrl = result.redirect_url;
    }
  } catch (error) {
    console.error('Error getting redirect URL:', error);
  }
  
  // Example implementation with nodemailer:
  /*
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  const customerEmail = payment.metadata.customer_email;
  
  if (!customerEmail) {
    console.log('No customer email found, skipping email notification');
    return;
  }
  
  await transporter.sendMail({
    from: '"ZOLA Business Setup" <noreply@zolabusiness.com>',
    to: customerEmail,
    subject: 'Payment Confirmation - ZOLA Business Setup',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Confirmation</h2>
        <p>Dear ${payment.metadata.customer_name || 'Customer'},</p>
        <p>Thank you for your payment. We've received your payment of ${payment.amount} AED successfully.</p>
        <p>Transaction ID: ${payment.id}</p>
        ${redirectUrl ? `<p><strong>Access your business case: <a href="${redirectUrl}">Client Portal</a></strong></p>` : ''}
        <p>Our team will be in touch with you shortly to begin the business setup process.</p>
        <p>Best regards,<br>ZOLA Business Setup Team</p>
      </div>
    `
  });
  */
  
  console.log(`Would send email for payment ${payment.id}${redirectUrl ? ' with client portal link: ' + redirectUrl : ''}`);
}

/**
 * Verify PayPal webhook signature
 */
function verifyPayPalWebhook(payload, headers, webhookId) {
  // This is a simplified implementation
  // In production, you should use the PayPal SDK to verify webhooks
  
  // Example implementation:
  /*
  const paypal = require('@paypal/checkout-server-sdk');
  
  // Pass the webhook ID, request body, and request headers
  const webhookEvent = new paypal.notification.webhookEvent.WebhookEvent(
    webhookId,
    headers,
    JSON.stringify(payload)
  );
  
  // Verify the webhook event
  const verifyResult = webhookEvent.verify();
  return verifyResult.verification_status === 'SUCCESS';
  */
  
  // For now, return true for testing
  return true;
}

/**
 * Verify Coinbase Commerce webhook signature
 */
function verifyCoinbaseSignature(payload, signature, secret) {
  try {
    const message = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
    
    // Use a constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature), 
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying Coinbase signature:', error);
    return false;
  }
}

module.exports = router;