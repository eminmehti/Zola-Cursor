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
const fs = require('fs');
const csv = require('csv-parser');

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
let PORT = process.env.PORT || 2000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
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

// Initialize Pinecone client
let pinecone;
try {
  console.log(`Server: Initializing Pinecone with index ${PINECONE_INDEX}`);
  pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY
    // Environment parameter is no longer needed with latest Pinecone SDK
  });
  console.log('Server: Pinecone client initialized successfully');
  
  // Test Pinecone connection
  (async () => {
    try {
      console.log('Testing Pinecone connection...');
      const indexes = await pinecone.listIndexes();
      console.log(`Available indexes: ${indexes.indexes.map(idx => idx.name).join(', ')}`);
      
      if (indexes.indexes.some(idx => idx.name === PINECONE_INDEX)) {
        console.log(`Found configured index "${PINECONE_INDEX}"`);
        const index = pinecone.index(PINECONE_INDEX);
        const stats = await index.describeIndexStats();
        console.log('Index stats:', stats);
      } else {
        console.warn(`Warning: Configured index "${PINECONE_INDEX}" not found in your account.`);
      }
    } catch (err) {
      console.error('Error testing Pinecone connection:', err);
    }
  })();
} catch (error) {
  console.error('Server: Error initializing Pinecone client:', error);
}

// Import the data preprocessor
const dataPreprocessor = require('./data-preprocessor');

// Import the retrieval service
const retrievalService = require('./retrieval-service');
// Import the proposal generator
const proposalGenerator = require('./proposal-generator');

// Add dependencies for Firebase Admin at the top of the file if not already there
const admin = require('firebase-admin');

// Import the mock pinecone service
const mockPinecone = require('./mock-pinecone');

// Enhanced function to preprocess freezone data before upserting to Pinecone
async function preprocessFreezoneData(csvPath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => {
        // Transform and clean the data
        const cleanedData = cleanFreezoneData(data);
        if (cleanedData) {
          results.push(cleanedData);
        }
      })
      .on('end', () => {
        console.log(`Processed ${results.length} freezone records`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('Error processing CSV:', error);
        reject(error);
      });
  });
}

// Clean and normalize freezone data
function cleanFreezoneData(rawData) {
  // Skip incomplete or header rows
  if (!rawData['Package title'] || rawData['Package title'] === 'Package title') {
    return null;
  }
  
  // Extract freezone name and package details
  const packageTitle = rawData['Package title'] || '';
  const freezoneName = extractFreezoneNameFromPackage(packageTitle);
  const visaCount = extractVisaCountFromPackage(packageTitle);
  
  // Extract and normalize location
  const location = rawData['Location'] || '';
  
  // Extract and normalize cost structures
  const setupCost = parseFloat(rawData['Setup cost'] || '0');
  const renewalCost = parseFloat(rawData['Renewal cost'] || '0');
  
  // Extract visa information
  const maxVisas = parseInt(rawData['Maximum visas'] || '0', 10);
  const visaAllocation = rawData['Visa special'] || '';
  
  // Extract activity information
  const activities = rawData['Activities (all)'] || '';
  const maxActivities = rawData['Maximum activities'] || '';
  const prohibitedActivities = rawData['Prohibited activities'] || '';
  
  // Extract setup timeframe information
  const licenseIssuance = rawData['License issuance time'] || '';
  const visaProcessing = rawData['Visa processing time'] || '';
  const totalTimeframe = rawData['Total setup timeframe'] || '';
  
  // Build a structured object with normalized and cleaned data
  return {
    freezoneName,
    packageName: packageTitle,
    location,
    costStructure: {
      setupCost: setupCost || 0,
      renewalCost: renewalCost || 0,
      licenseFee: parseFloat(rawData['License fee'] || '0'),
      registrationFee: parseFloat(rawData['Registration fee'] || '0'),
      visaCost: parseFloat(rawData['Visa cost per visa'] || '0'),
      officeCost: parseFloat(rawData['Office cost'] || '0'),
      officeDescription: rawData['Office description'] || '',
      physicalOfficeCost: parseFloat(rawData['Physical office cost'] || '0'),
      paymentOptions: (rawData['Payment options'] || '').split(',').map(opt => opt.trim())
    },
    visaInfo: {
      initialAllocation: visaCount,
      maxAllocation: maxVisas,
      special: visaAllocation
    },
    activities: {
      supportedActivities: activities.split(',').map(act => act.trim()),
      maxActivities: maxActivities,
      prohibited: prohibitedActivities.split(',').map(act => act.trim())
    },
    setupTimeframe: {
      licenseIssuance,
      visaProcessingPerPerson: visaProcessing,
      totalEstimate: totalTimeframe,
      expediteOptions: (rawData['Expedite options'] || '').split(',').map(opt => opt.trim())
    },
    keyBenefits: {
      points: (rawData['General features'] || '').split(',').map(feature => feature.trim()),
      activityFlexibility: maxActivities.includes('Unlimited') || parseInt(maxActivities, 10) > 5
    },
    corporateRequirements: {
      minShareholders: parseInt(rawData['Minimum shareholders'] || '1', 10),
      maxShareholders: rawData['Maximum shareholders'] || '',
      minDirectors: parseInt(rawData['Minimum directors'] || '1', 10),
      maxDirectors: parseInt(rawData['Maximum directors'] || '1', 10),
      corporateDirectorsAllowed: rawData['Corporate directors allowed'] === 'Yes'
    }
  };
}

// Extract freezone name from package title
function extractFreezoneNameFromPackage(packageTitle) {
  if (!packageTitle) return '';
  
  // Common pattern: "Freezone Name (Package Details)"
  const match = packageTitle.match(/^([^(]+)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return packageTitle;
}

// Extract visa count from package title
function extractVisaCountFromPackage(packageTitle) {
  if (!packageTitle) return 0;
  
  // Common pattern: "Freezone Name (X visa)"
  const match = packageTitle.match(/\((\d+)\s*visa\)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 0;
}

// Function to upsert processed freezone data to Pinecone
async function upsertFreezoneToPinecone(processedData) {
  try {
    // Get the index
    const index = pinecone.index(PINECONE_INDEX);
    
    // Create vectors with embeddings
    const vectors = await Promise.all(processedData.map(async (freezone) => {
      // Create detailed text representation for embedding
      const textRepresentation = `
        Freezone: ${freezone.freezoneName}
        Package: ${freezone.packageName}
        Location: ${freezone.location}
        Setup Cost: ${freezone.costStructure.setupCost}
        Renewal Cost: ${freezone.costStructure.renewalCost}
        Visa Count: ${freezone.visaInfo.initialAllocation}
        Max Visas: ${freezone.visaInfo.maxAllocation}
        Activities: ${freezone.activities.supportedActivities.join(', ')}
        Setup Time: ${freezone.setupTimeframe.totalEstimate}
        Key Benefits: ${freezone.keyBenefits.points.join(', ')}
      `;
      
      // Get embedding
      const embedding = await getEmbedding(textRepresentation);
      
      // Create vector
      return {
        id: `freezone-${freezone.freezoneName}-${freezone.visaInfo.initialAllocation}`,
        values: embedding,
        metadata: freezone
      };
    }));
    
    // Upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
      console.log(`Upserted batch ${i/batchSize + 1} of ${Math.ceil(vectors.length/batchSize)}`);
    }
    
    console.log(`Successfully upserted ${vectors.length} freezone records to Pinecone`);
    return true;
  } catch (error) {
    console.error('Error upserting to Pinecone:', error);
    return false;
  }
}

// Function to get embedding
async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      dimensions: 1536
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

// Start the server with port-finding capability
const startServer = () => {
  const server = app.listen(PORT)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Port ${PORT} is already in use.`);
        
        // Try the next port instead of attempting to kill the process
        const newPort = PORT + 1;
        console.log(`Trying port ${newPort} instead...`);
        PORT = newPort;
        setTimeout(startServer, 1000);
        
        // Inform user about how to clean up if needed
        console.log('\nIf you want to terminate the process using port 2000:');
        if (process.platform === 'win32') {
          console.log('Run in Command Prompt as Administrator:');
          console.log('  netstat -ano | findstr :2000');
          console.log('  taskkill /F /PID <PID>');
        } else {
          console.log('Run:');
          console.log('  node cleanup-port.js');
          console.log('  or');
          console.log('  lsof -i :2000 | grep LISTEN');
          console.log('  kill -9 <PID>');
        }
      } else {
        console.error('Error starting server:', err);
      }
    })
    .on('listening', () => {
      console.log(`Server running on port ${PORT}`);
      
      // Only show this warning if we're running on a different port than the default/configured one
      const defaultPort = parseInt(process.env.PORT || 2000);
      if (PORT !== defaultPort) {
        console.log(`⚠️ Note: Server is running on port ${PORT} instead of the configured port ${defaultPort}`);
        console.log(`You may need to update any front-end configurations accordingly.`);
      }
    });
};

startServer();

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
  console.log('Received request for / (root) - serving UI1.html');
  res.sendFile(path.join(__dirname, 'UI1.html'));
});

app.get('/UI1.html', (req, res) => {
  console.log('Received request for /UI1.html - serving UI1.html');
  res.sendFile(path.join(__dirname, 'UI1.html'));
});

app.get('/questionnaire', (req, res) => {
  console.log('Received request for /questionnaire - serving UI2.html');
  res.sendFile(path.join(__dirname, 'UI2.html'));
});

app.get('/UI2.html', (req, res) => {
  console.log('Received request for /UI2.html - serving UI2.html');
  res.sendFile(path.join(__dirname, 'UI2.html'));
});

app.get('/ui4', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI4.html'));
});

app.get('/UI4.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI4.html'));
});

app.get('/ui6', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI6.html'));
});

app.get('/UI6.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI6.html'));
});

app.get('/ui7', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI7.html'));
});

app.get('/UI7.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI7.html'));
});

app.get('/ui8', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI8.html'));
});

app.get('/UI8.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI8.html'));
});

app.get('/ui9', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI9.html'));
});

app.get('/UI9.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI9.html'));
});

// Route for UI10 (Proposal Page)
app.get('/ui10', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI10.html'));
});

app.get('/UI10.html', (req, res) => {
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
          if (!pinecone) {
            console.error('Pinecone client is not initialized, using mock data');
            // Return mock data instead of attempting to use Pinecone
            const mockData = mockPinecone.getMockProposalData();
            return res.json({
              status: 'success',
              proposals: mockData.proposals,
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
          }

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
            model: 'o3-mini-2025-01-31',
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
            response_format: { type: "json_object" }
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
          // Fallback to mock data when AI processing fails
          const mockData = mockPinecone.getMockProposalData();
          return res.json({
            status: 'success',
            proposals: mockData.proposals,
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

// Admin route to reprocess and update Pinecone data
app.post('/api/admin/reprocess-data', async (req, res) => {
  // Check for admin authentication
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized access' });
  }
  
  try {
    const csvPath = path.join(__dirname, 'freezonedata.csv');
    
    // Process and upsert the data
    const success = await dataPreprocessor.processAndUpsertFreezoneData(csvPath);
    
    if (success) {
      res.json({ success: true, message: 'Freezone data successfully reprocessed and updated in Pinecone' });
    } else {
      res.status(500).json({ error: 'Failed to reprocess data' });
    }
  } catch (error) {
    console.error('Error reprocessing data:', error);
    res.status(500).json({ error: 'An error occurred while reprocessing data' });
  }
});

// API endpoint to generate a personalized proposal
app.post('/api/proposal', async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate request data
    if (!userData) {
      return res.status(400).json({ error: 'No user data provided' });
    }
    
    console.log('Received proposal request with data:', JSON.stringify(userData, null, 2));
    
    // Step 1: Get ranked suggestions from retrieval service
    console.log('Fetching freezone suggestions...');
    let rankedSuggestions;
    
    try {
      rankedSuggestions = await retrievalService.getRankedFreezoneSuggestions(userData);
    } catch (error) {
      console.error('Error getting ranked suggestions:', error);
      // Use fallback suggestions instead
      rankedSuggestions = retrievalService.generateFallbackSuggestions(userData);
    }
    
    if (!rankedSuggestions || !Array.isArray(rankedSuggestions) || rankedSuggestions.length === 0) {
      console.error('No valid freezone suggestions returned from retrieval service');
      return res.status(500).json({ 
        error: 'No matching freezones found. Please adjust your criteria.',
        errorCode: 'NO_MATCHES_FOUND'
      });
    }
    
    console.log(`Retrieved ${rankedSuggestions.length} ranked suggestions`);
    
    // Step 2: Generate personalized proposal
    console.log('Generating proposal...');
    const proposal = await proposalGenerator.generateProposal(userData, rankedSuggestions);
    
    // Step 3: Save proposal to database
    try {
      const proposalId = await saveProposalToDatabase(userData, proposal);
      proposal.proposalId = proposalId;
    } catch (dbError) {
      console.error('Error saving proposal to database:', dbError);
      // Continue processing even if database save fails
    }
    
    // Return the generated proposal
    console.log('Returning proposal to client');
    return res.json({ proposal });
    
  } catch (error) {
    console.error('Error in proposal generation endpoint:', error);
    return res.status(500).json({ 
      error: 'An error occurred while generating your proposal. Please try again.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorCode: 'PROPOSAL_GENERATION_ERROR'
    });
  }
});

/**
 * API endpoint to get the redirect URL for a payment
 */
app.get('/api/payment-redirect', (req, res) => {
  const transactionId = req.query.transaction_id;
  
  if (!transactionId) {
    return res.status(400).json({ error: 'Missing transaction ID' });
  }
  
  db.get(
    'SELECT redirect_url FROM payments WHERE payment_id = ?',
    [transactionId],
    (err, row) => {
      if (err) {
        console.error('Error fetching redirect URL:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!row || !row.redirect_url) {
        return res.json({ success: false, message: 'No redirect URL found' });
      }
      
      res.json({ success: true, redirect_url: row.redirect_url });
    }
  );
});

