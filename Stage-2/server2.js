// server.js

require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// ----------- UPDATED IMPORTS FOR PINECONE + OPENAI -----------
const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');

// ----------- PAYMENT GATEWAY IMPORTS -----------
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Load secrets from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'openaiembedding';

// Payment API keys
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
const COINBASE_COMMERCE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY;
const COINBASE_COMMERCE_WEBHOOK_SECRET = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;

// Make sure we have them
if (!OPENAI_API_KEY || !PINECONE_API_KEY) {
  console.error("Missing environment variables for OpenAI/Pinecone. Check your .env file.");
  process.exit(1);
}

// Check for payment keys
if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_SECRET_KEY) {
  console.warn("Stripe API keys missing. Card payments will not work.");
}

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.warn("PayPal API keys missing. PayPal payments will not work.");
}

if (!COINBASE_COMMERCE_API_KEY) {
  console.warn("Coinbase Commerce API key missing. Crypto payments will not work.");
}

const app = express();
const PORT = process.env.PORT || 2000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Capture PayPal order
app.post('/api/capture-paypal-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    console.log('Capturing PayPal order:', orderId);
    
    // Check if PayPal credentials are configured
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error('PayPal API keys missing');
      return res.status(500).json({ error: 'PayPal is not configured properly' });
    }
    
    // Determine the correct PayPal API URL based on environment
    const paypalBaseUrl = PAYPAL_ENVIRONMENT === 'live' 
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';
    
    // Get access token
    const tokenResponse = await axios({
      method: 'post',
      url: `${paypalBaseUrl}/v1/oauth2/token`,
      auth: {
        username: PAYPAL_CLIENT_ID,
        password: PAYPAL_CLIENT_SECRET
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials'
    });
    
    if (!tokenResponse.data || !tokenResponse.data.access_token) {
      console.error('Failed to get PayPal access token');
      return res.status(500).json({ error: 'Failed to authenticate with PayPal' });
    }
    
    const accessToken = tokenResponse.data.access_token;
    
    // Capture the payment
    console.log('Sending capture request to PayPal API');
    const captureResponse = await axios({
      method: 'post',
      url: `${paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `capture-${orderId}-${Date.now()}`  // Idempotency key
      }
    });
    
    console.log('PayPal capture response received:', captureResponse.data.status);
    
    // Update payment status in database
    db.run(
      'UPDATE payments SET status = ? WHERE payment_id = ?',
      ['COMPLETED', orderId],
      function(err) {
        if (err) {
          console.error('Error updating payment status in database:', err);
          // Don't fail the request if DB update fails
        } else {
          console.log('Payment status updated in database');
        }
      }
    );
    
    // Return capture response to client
    res.json(captureResponse.data);
  } catch (error) {
    console.error('Error capturing PayPal payment:', error.message);
    
    if (error.response) {
      console.error('PayPal API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      return res.status(error.response.status).json({ 
        error: 'PayPal API error during capture',
        details: error.response.data
      });
    } else if (error.request) {
      console.error('No response received from PayPal API during capture');
      return res.status(500).json({ error: 'No response from PayPal server during capture' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get PayPal configuration
app.get('/api/paypal-config', (req, res) => {
  if (!PAYPAL_CLIENT_ID) {
    return res.status(500).json({ error: 'PayPal client ID not configured' });
  }
  
  res.json({
    clientId: PAYPAL_CLIENT_ID,
    environment: PAYPAL_ENVIRONMENT || 'sandbox'
  });
});

// Create PayPal order - FIXED VERSION
app.post('/api/create-paypal-order', async (req, res) => {
  try {
    const { amount, currency = 'AED', description = 'ZOLA Business Setup', metadata = {} } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    // Log the request details for debugging
    console.log('PayPal order request:', { amount, currency, description, metadata });
    
    // Check if PayPal credentials are configured
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error('PayPal API keys missing');
      return res.status(500).json({ error: 'PayPal is not configured properly' });
    }
    
    // Determine the correct PayPal API URL based on environment
    const paypalBaseUrl = PAYPAL_ENVIRONMENT === 'live' 
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';
    
    // First, get an access token
    console.log('Requesting PayPal access token');
    const tokenResponse = await axios({
      method: 'post',
      url: `${paypalBaseUrl}/v1/oauth2/token`,
      auth: {
        username: PAYPAL_CLIENT_ID,
        password: PAYPAL_CLIENT_SECRET
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials'
    });
    
    if (!tokenResponse.data || !tokenResponse.data.access_token) {
      console.error('Failed to get PayPal access token:', tokenResponse.data);
      return res.status(500).json({ error: 'Failed to authenticate with PayPal' });
    }
    
    const accessToken = tokenResponse.data.access_token;
    console.log('PayPal access token obtained');
    
    // Format the amount properly (PayPal is strict about numeric strings)
    const formattedAmount = parseFloat(amount).toFixed(2);
    
    // Create the order
    console.log('Creating PayPal order with amount:', formattedAmount);
    const orderResponse = await axios({
      method: 'post',
      url: `${paypalBaseUrl}/v2/checkout/orders`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: formattedAmount
            },
            description: description,
            custom_id: JSON.stringify(metadata)
          }
        ],
        application_context: {
          brand_name: 'ZOLA',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${req.protocol}://${req.get('host')}/payment-success`,
          cancel_url: `${req.protocol}://${req.get('host')}/UI11.html`
        }
      }
    });
    
    const orderId = orderResponse.data.id;
    console.log('PayPal order created successfully:', orderId);
    
    // Save payment info to database
    const insertSql = `
      INSERT INTO payments (payment_id, payment_type, amount, currency, status, customer_name, customer_email, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(
      insertSql,
      [
        orderId,
        'paypal',
        formattedAmount,
        currency,
        'CREATED',
        metadata.customer_name || '',
        metadata.customer_email || '',
        JSON.stringify(metadata)
      ],
      function(err) {
        if (err) {
          console.error('Error saving payment to database:', err);
          // Don't fail the request if DB storage fails
        }
      }
    );
    
    // Return the order ID and status to the client
    res.json({
      id: orderId,
      status: orderResponse.data.status
    });
  } catch (error) {
    // Detailed error logging
    console.error('Error creating PayPal order:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('PayPal API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      return res.status(error.response.status).json({ 
        error: 'PayPal API error',
        details: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from PayPal API:', error.request);
      return res.status(500).json({ error: 'No response from PayPal server' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up PayPal request:', error.message);
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Simplified PayPal Order Creation Endpoint
app.post('/api/create-paypal-order-simple', async (req, res) => {
  try {
    // Log the request for debugging
    console.log('PayPal simple order request:', req.body);
    
    const { amount, currency = 'USD', description = 'ZOLA Business Setup' } = req.body;
    
    // Basic validation
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    // Format amount properly (PayPal requires exactly 2 decimal places)
    const formattedAmount = parseFloat(amount).toFixed(2);
    console.log('Formatted amount for PayPal:', formattedAmount);
    
    // Determine environment
    const isProduction = process.env.NODE_ENV === 'production';
    const paypalEnvironment = process.env.PAYPAL_ENVIRONMENT || (isProduction ? 'live' : 'sandbox');
    const paypalBaseUrl = paypalEnvironment === 'live' 
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';
    
    console.log(`Using PayPal ${paypalEnvironment} environment`);
    
    // Check if PayPal credentials are configured
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error('PayPal API keys missing');
      return res.status(500).json({ error: 'PayPal is not configured properly' });
    }
    
    // Get access token
    const tokenResponse = await axios({
      method: 'post',
      url: `${paypalBaseUrl}/v1/oauth2/token`,
      auth: {
        username: PAYPAL_CLIENT_ID,
        password: PAYPAL_CLIENT_SECRET
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials'
    });
    
    if (!tokenResponse.data || !tokenResponse.data.access_token) {
      console.error('Failed to get PayPal access token');
      return res.status(500).json({ error: 'Failed to authenticate with PayPal' });
    }
    
    const accessToken = tokenResponse.data.access_token;
    
    // IMPORTANT: PayPal doesn't support AED directly, so we're using USD
    // In a production app, you'd use a currency conversion service
    
    // Prepare order data - keep it minimal with all required fields
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD', // Using USD since PayPal may not support AED directly
            value: formattedAmount
          },
          description: description
        }
      ],
      application_context: {
        brand_name: 'ZOLA',
        landing_page: 'LOGIN',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${req.protocol}://${req.get('host')}/payment-success`,
        cancel_url: `${req.protocol}://${req.get('host')}/ui11`
      }
    };
    
    // Log the payload being sent to PayPal
    console.log('PayPal order request data:', JSON.stringify(orderData));
    
    // Create order
    const orderResponse = await axios({
      method: 'post',
      url: `${paypalBaseUrl}/v2/checkout/orders`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      },
      data: orderData
    });
    
    // Log success and links
    console.log('PayPal order created successfully');
    console.log('Order ID:', orderResponse.data.id);
    console.log('Status:', orderResponse.data.status);
    
    // Find the approve URL from the links in the response
    let approveUrl = '';
    if (orderResponse.data.links && Array.isArray(orderResponse.data.links)) {
      const approveLink = orderResponse.data.links.find(link => link.rel === 'approve');
      if (approveLink) {
        approveUrl = approveLink.href;
      }
    }
    
    // If we couldn't find the approve link, construct it manually
    if (!approveUrl) {
      approveUrl = paypalEnvironment === 'live'
        ? `https://www.paypal.com/checkoutnow?token=${orderResponse.data.id}`
        : `https://www.sandbox.paypal.com/checkoutnow?token=${orderResponse.data.id}`;
    }
    
    console.log('PayPal redirect URL:', approveUrl);
    
    // Send back the necessary data
    res.json({
      id: orderResponse.data.id,
      status: orderResponse.data.status,
      redirect_url: approveUrl
    });
  } catch (error) {
    // Enhanced error handling
    console.error('PayPal order creation failed:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      if (error.response.headers) {
        console.error('Headers:', JSON.stringify(error.response.headers));
      }
      if (error.response.data) {
        console.error('Data:', JSON.stringify(error.response.data));
      }
      
      // Return a more specific error based on PayPal's response
      return res.status(error.response.status).json({ 
        error: 'PayPal API error', 
        status: error.response.status,
        details: error.response.data
      });
    } else if (error.request) {
      console.error('No response received from PayPal');
      return res.status(502).json({ error: 'No response from PayPal servers' });
    } else {
      console.error('Error:', error.message);
    }
    
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize Pinecone client - Fixed to work with Pinecone SDK v5.0.0
const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY
});

// PayPal token management helper
let paypalAccessToken = null;
let paypalTokenExpiry = 0;

// Get PayPal access token with caching
const getPayPalAccessToken = async () => {
  // Check if we have a valid cached token
  const now = Date.now();
  if (paypalAccessToken && paypalTokenExpiry > now) {
    console.log('Using cached PayPal access token');
    return paypalAccessToken;
  }
  
  console.log('Getting new PayPal access token');
  
  // Determine the API URL based on environment
  const paypalBaseUrl = process.env.PAYPAL_ENVIRONMENT === 'live' 
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com';
  
  try {
    // Basic validation of credentials
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials are missing');
    }
    
    // Make the token request
    const response = await axios({
      method: 'post',
      url: `${paypalBaseUrl}/v1/oauth2/token`,
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_CLIENT_SECRET
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials'
    });
    
    // Validate the response
    if (!response.data || !response.data.access_token) {
      throw new Error('Invalid response from PayPal token endpoint');
    }
    
    // Cache the token
    paypalAccessToken = response.data.access_token;
    // Token usually expires in 32000 seconds (about 9 hours), but we'll use 8 hours to be safe
    paypalTokenExpiry = now + (8 * 60 * 60 * 1000);
    
    return paypalAccessToken;
  } catch (error) {
    // Detailed error logging
    console.error('PayPal token error:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from PayPal');
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
};

// ----------------------------------------------------
// 1) SET UP DB CONNECTION
// ----------------------------------------------------
const db = new sqlite3.Database('./mydb.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database (mydb.sqlite).');
    
    // Create payments table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id TEXT,
        payment_type TEXT,
        amount REAL,
        currency TEXT,
        status TEXT,
        customer_name TEXT,
        customer_email TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create userAnswers table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS userAnswers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId TEXT,
        businessCategory TEXT,
        officeSpace TEXT,
        businessActivity TEXT,
        shareholders TEXT,
        visas INTEGER,
        fullName TEXT,
        phoneNumber TEXT,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
});

// ----------------------------------------------------
// 2) USE SESSION MIDDLEWARE
// ----------------------------------------------------
app.use(session({
  secret: process.env.SESSION_SECRET || 'YOUR_SECRET_KEY_HERE', // replace with a secure secret in production
  resave: false,
  saveUninitialized: true
}));

// ----------------------------------------------------
// 3) MIDDLEWARE
// ----------------------------------------------------
// Special middleware for Stripe webhooks (raw body)
app.use('/webhook/stripe', express.raw({ type: 'application/json' }));

// For regular routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// ----------------------------------------------------
// 4) SERVE STATIC FILES
// ----------------------------------------------------
app.use(express.static(path.join(__dirname)));

// ----------------------------------------------------
// 5) ROUTES FOR SCREENS
// ----------------------------------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI1.html'));
});

app.get('/questionnaire', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI2.html'));
});

app.get('/ui4', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI4.html'));
});

app.get('/ui6', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI6.html'));
});

app.get('/ui7', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI7.html'));
});

app.get('/ui8', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI8.html'));
});

app.get('/ui9', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI9.html'));
});

// Route for UI10 (Proposal Page)
app.get('/ui10', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI10.html'));
});

// Fixed route for UI11 (Payment Page)
app.get('/ui11', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI11.html'));
});

// Alternative route for UI11 (just to be safe)
app.get('/UI11.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI11.html'));
});

// ----------------------------------------------------
// 6) SAVE-ANSWER (STORE PARTIAL DATA IN SESSION)
// ----------------------------------------------------
app.post('/save-answer', (req, res) => {
  const { question, answer } = req.body;

  // Initialize formData if not present
  if (!req.session.formData) {
    req.session.formData = {};
  }

  // Save the answer to session
  req.session.formData[question] = answer;

  console.log('Session data so far:', req.session.formData);

  return res.json({ status: 'ok' });
});

// ----------------------------------------------------
// 7) FINAL SUBMIT (WRITE TO DB IF COMPLETE)
// ----------------------------------------------------
app.post('/final-submit', (req, res) => {
  // Merge final user data into session
  const { fullName, phoneNumber, email } = req.body;

  if (!req.session.formData) {
    req.session.formData = {};
  }

  req.session.formData.fullName = fullName;
  req.session.formData.phoneNumber = phoneNumber;
  req.session.formData.email = email;

  // Now we have (hopefully) all data in req.session.formData
  const formData = req.session.formData;

  // Quick check for completeness
  if (
    !formData.businessCategory ||
    !formData.officeSpace ||
    !formData.businessActivity ||
    !formData.shareholders ||
    formData.visas === undefined ||
    !formData.fullName ||
    !formData.phoneNumber ||
    !formData.email
  ) {
    return res.json({ status: 'error', message: 'Form not completed fully.' });
  }

  // Convert officeSpace array to string for DB
  let officeSpaceStr = '';
  if (Array.isArray(formData.officeSpace)) {
    officeSpaceStr = formData.officeSpace.join(', ');
  } else {
    // In case it was stored as a single string
    officeSpaceStr = formData.officeSpace;
  }

  // Insert into userAnswers table
  const insertSql = `
    INSERT INTO userAnswers
    (sessionId, businessCategory, officeSpace, businessActivity, shareholders, visas, fullName, phoneNumber, email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    req.session.id,
    formData.businessCategory,
    officeSpaceStr,
    formData.businessActivity,
    formData.shareholders,
    formData.visas,
    formData.fullName,
    formData.phoneNumber,
    formData.email
  ];

  db.run(insertSql, values, function (err) {
    if (err) {
      console.error('Error inserting into DB:', err);
      return res.json({ status: 'error', message: err.message });
    }
    // Successfully inserted
    console.log('Successfully inserted row with id =', this.lastID);

    // Return successful response with session ID for redirecting to UI10
    res.json({ 
      status: 'success', 
      sessionId: req.session.id 
    });
  });
});

// -----------------------------------------------------------------
// 8) UPDATED ENDPOINT: GENERATE PROPOSAL USING PINECONE + OPENAI
// -----------------------------------------------------------------
app.post('/generate-proposal', async (req, res) => {
  try {
    // 1) Retrieve the sessionId from the request
    const { sessionId } = req.body;

    // If there's no sessionId provided in the request, we cannot proceed
    if (!sessionId) {
      return res.status(400).json({ status: 'error', message: 'No session ID provided.' });
    }

    // 2) Get user data from the database using the sessionId
    db.get(
      'SELECT * FROM userAnswers WHERE sessionId = ? ORDER BY id DESC LIMIT 1',
      [sessionId],
      async (err, row) => {
        if (err) {
          console.error('DB error:', err);
          return res.status(500).json({ status: 'error', message: 'Database error.' });
        }

        if (!row) {
          return res.status(404).json({ status: 'error', message: 'No user data found for this session.' });
        }

        try {
          // 3) Combine user answers into a single string for embedding
          const userDataString = `
            Business Category: ${row.businessCategory}
            Office Space Needs: ${row.officeSpace}
            Business Activity: ${row.businessActivity}
            Shareholders: ${row.shareholders}
            Number of Visas: ${row.visas}
          `;

          // 4) Create an embedding for the user data
          const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-large',
            input: userDataString,
          });
          
          const userEmbedding = embeddingResponse.data[0].embedding;

          // 5) Query Pinecone to find the most relevant freezone data
          const index = pinecone.index(PINECONE_INDEX);
          const queryResponse = await index.query({
            vector: userEmbedding,
            topK: 5,
            includeMetadata: true
          });

          const matches = queryResponse.matches || [];

          // Build context from the matched freezone data
          let pineconeContext = '';
          matches.forEach((match, idx) => {
            if (match.metadata) {
              pineconeContext += `Freezone Option ${idx + 1}:\n${JSON.stringify(match.metadata)}\n\n`;
            }
          });

          // 6) Generate multiple proposals using OpenAI with the context
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `You are an expert consultant specializing in Dubai free zones. 
                Your task is to analyze user requirements and recommend multiple suitable free zone options.
                You'll create 4 different comprehensive proposals that will be displayed to the user.`
              },
              {
                role: 'user',
                content: `Based on the following user requirements:
                
                ${userDataString}
                
                And using this context from our freezone database:
                
                ${pineconeContext}
                
                Please generate 4 different free zone proposals. Each proposal should recommend a different free zone.
                
                Return your response in this JSON format:
                {
                  "proposals": [
                    {
                      "recommendedFreeZone": "Name of the 1st recommended free zone",
                      "whyRecommended": "Brief explanation of why this freezone is recommended",
                      "keyBenefits": ["Benefit 1", "Benefit 2", ...],
                      "featuresAndAttributes": {
                        "maximumActivities": "...",
                        "maximumVisas": "...",
                        "minimumShareholders": "...",
                        "maximumShareholders": "...",
                        "minimumDirectors": "...",
                        "maximumDirectors": "...",
                        "companySecretaryRequired": "...",
                        "corporateSecretaryAllowed": "...",
                        "corporateDirectorsAllowed": "..."
                      },
                      "costBreakdown": {
                        "licenseSetupFee": number,
                        "licenseRenewalFee": number,
                        "visaFees": number,
                        "officeCost": number,
                        "otherFees": number,
                        "total": number
                      },
                      "setupProcess": ["Step 1", "Step 2", ...]
                    },
                    {
                      // 2nd proposal with different free zone
                    },
                    {
                      // 3rd proposal with different free zone
                    },
                    {
                      // 4th proposal with different free zone
                    }
                  ]
                }
                
                Make sure each proposal recommends a different free zone with unique advantages and tailored to the user's needs in different ways.
                Ensure each freezone has different cost structures and benefits to give the user meaningful choices.`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          });

          // Parse the response to get the proposals array
          const responseData = JSON.parse(completion.choices[0].message.content);
          const proposals = responseData.proposals || [];

          // 7) Return all proposals and user data
          return res.json({
            status: 'success',
            proposals: proposals,
            userData: {
              fullName: row.fullName,
              email: row.email,
              phoneNumber: row.phoneNumber,
              businessCategory: row.businessCategory,
              officeSpace: row.officeSpace,
              businessActivity: row.businessActivity,
              shareholders: row.shareholders,
              visas: row.visas
            }
          });
        } catch (error) {
          console.error('Error in AI processing:', error);
          return res.status(500).json({ 
            status: 'error', 
            message: 'Error processing with AI', 
            details: error.message 
          });
        }
      }
    );
  } catch (error) {
    console.error('Error in generate-proposal endpoint:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server error', 
      details: error.message 
    });
  }
});

// Get user data by session ID (for UI10 to fetch user details)
app.get('/api/user-data/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessionId) {
    return res.status(400).json({ status: 'error', message: 'Session ID is required' });
  }
  
  db.get(
    'SELECT * FROM userAnswers WHERE sessionId = ? ORDER BY id DESC LIMIT 1',
    [sessionId],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ status: 'error', message: 'Database error' });
      }
      
      if (!row) {
        return res.status(404).json({ status: 'error', message: 'User data not found' });
      }
      
      res.json({
        status: 'success',
        userData: row
      });
    }
  );
});

// ----------------------------------------------------
// PAYMENT API ENDPOINTS
// ----------------------------------------------------

// Get Stripe configuration
app.get('/api/stripe-config', (req, res) => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    return res.status(500).json({ error: 'Stripe API key not configured' });
  }
  
  res.json({
    publishableKey: STRIPE_PUBLISHABLE_KEY
  });
});

// Create Stripe payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'aed', metadata = {} } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    // Convert AED to cents (Stripe requires amounts in the smallest currency unit)
    const amountInCents = Math.round(amount * 100);
    
    console.log(`Creating payment intent: ${amountInCents} ${currency.toLowerCase()}`);
    
    // Create a payment intent with automatic payment methods enabled for Payment Element
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always'
      },
      description: `ZOLA - ${metadata.freezone || 'Business Setup'} Package`,
      receipt_email: metadata.customer_email || undefined
    });
    
    console.log(`Payment intent created: ${paymentIntent.id}`);
    
    // Save payment info to database
    const insertSql = `
      INSERT INTO payments (payment_id, payment_type, amount, currency, status, customer_name, customer_email, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(
      insertSql,
      [
        paymentIntent.id,
        'stripe',
        amount,
        currency.toUpperCase(),
        paymentIntent.status,
        metadata.customer_name || '',
        metadata.customer_email || '',
        JSON.stringify(metadata)
      ],
      function(err) {
        if (err) {
          console.error('Error saving payment to database:', err);
          // Continue even if DB storage fails
        } else {
          console.log(`Payment recorded in database: ${paymentIntent.id}`);
        }
      }
    );
    
    // Return the client secret to the frontend
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update payment status (optional, can be used when webhook isn't available)
app.post('/api/update-payment-status', async (req, res) => {
  try {
    const { paymentIntentId, status } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' });
    }
    
    // Update the payment status in the database
    db.run(
      'UPDATE payments SET status = ? WHERE payment_id = ?',
      [status, paymentIntentId],
      function(err) {
        if (err) {
          console.error('Error updating payment status:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Payment record not found' });
        }
        
        res.json({ status: 'success' });
      }
    );
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle Stripe webhook for asynchronous payment events
app.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  if (STRIPE_WEBHOOK_SECRET) {
    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
      console.log('Webhook signature verified');
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // If no webhook secret is configured, use the raw body directly
    // WARNING: This should only be used in development!
    try {
      event = JSON.parse(req.body.toString());
      console.warn('Stripe webhook secret not configured, skipping signature verification');
    } catch (err) {
      console.error('Error parsing webhook payload:', err);
      return res.status(400).send('Webhook Error: Invalid payload');
    }
  }
  
  // Log the event
  console.log(`Received Stripe webhook event: ${event.type}`);
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent was successful: ${paymentIntent.id}`);
      
      // Update payment status in the database
      db.run(
        'UPDATE payments SET status = ? WHERE payment_id = ?',
        ['COMPLETED', paymentIntent.id],
        function(err) {
          if (err) {
            console.error(`Error updating payment status: ${err.message}`);
          } else {
            console.log(`Updated payment status for ${paymentIntent.id}`);
          }
        }
      );
      break;
      
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      console.log(`Payment failed: ${failedPaymentIntent.id}`);
      
      // Update payment status in the database
      db.run(
        'UPDATE payments SET status = ? WHERE payment_id = ?',
        ['FAILED', failedPaymentIntent.id],
        function(err) {
          if (err) {
            console.error(`Error updating payment status: ${err.message}`);
          }
        }
      );
      break;
      
    case 'payment_intent.processing':
      const processingPaymentIntent = event.data.object;
      console.log(`Payment processing: ${processingPaymentIntent.id}`);
      
      // Update payment status in the database
      db.run(
        'UPDATE payments SET status = ? WHERE payment_id = ?',
        ['PROCESSING', processingPaymentIntent.id],
        function(err) {
          if (err) {
            console.error(`Error updating payment status: ${err.message}`);
          }
        }
      );
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  // Return a 200 response to acknowledge receipt of the event
  res.send({received: true});
});

// Handle API requests for recording wire transfers
app.post('/api/record-wire-transfer', (req, res) => {
  try {
    const { amount, currency = 'AED', metadata = {} } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    // Generate a reference number
    const referenceNumber = `WT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Save payment info to database
    const insertSql = `
      INSERT INTO payments (payment_id, payment_type, amount, currency, status, customer_name, customer_email, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(
      insertSql,
      [
        referenceNumber,
        'wire-transfer',
        amount,
        currency.toUpperCase(),
        'PENDING',
        metadata.customer_name || '',
        metadata.customer_email || '',
        JSON.stringify(metadata)
      ],
      function(err) {
        if (err) {
          console.error('Error saving wire transfer to database:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Return success with reference number
        res.json({
          status: 'success',
          referenceNumber: referenceNumber,
          message: 'Wire transfer recorded successfully. Please complete your bank transfer using the provided details.'
        });
      }
    );
  } catch (error) {
    console.error('Error recording wire transfer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route for handling successful payments
app.get('/payment-success', (req, res) => {
  const paymentIntentId = req.query.payment_intent;
  const paymentIntentClientSecret = req.query.payment_intent_client_secret;
  
  console.log('Payment success callback received:', { 
    paymentIntentId, 
    hasClientSecret: !!paymentIntentClientSecret 
  });
  
  if (paymentIntentId) {
    // Update payment status in database
    db.run(
      'UPDATE payments SET status = ? WHERE payment_id = ?',
      ['COMPLETED', paymentIntentId],
      function(err) {
        if (err) {
          console.error('Error updating payment status in database:', err);
        } else {
          console.log('Payment status updated to COMPLETED for payment:', paymentIntentId);
        }
      }
    );
  }
  
  // Redirect to a thank you page or back to home
  res.redirect('/payment-thank-you.html');
});

// Fallback route for payment thank you page
app.get('/payment-thank-you.html', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Payment Successful | ZOLA</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          text-align: center;
          padding: 50px;
          background-color: #f6f6f6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: #28a745;
          color: white;
          font-size: 32px;
          line-height: 64px;
          margin: 0 auto 24px;
        }
        h1 {
          color: #333;
          margin-bottom: 20px;
        }
        p {
          color: #666;
          margin-bottom: 30px;
          font-size: 16px;
          line-height: 1.5;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #635bff;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .button:hover {
          background-color: #5851e6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✓</div>
        <h1>Payment Successful!</h1>
        <p>Thank you for your payment. We've received your payment successfully.</p>
        <p>Our team will be in touch with you shortly to begin the business setup process.</p>
        <a href="/" class="button">Return to Home</a>
      </div>
    </body>
    </html>
  `);
});

