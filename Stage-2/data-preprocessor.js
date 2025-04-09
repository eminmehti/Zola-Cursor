// data-preprocessor.js
// Functions to preprocess freezone data for improved AI accuracy

require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;
// PINECONE_ENVIRONMENT is no longer needed with the modern API

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Initialize Pinecone client
let pinecone;
try {
  console.log(`Preprocessor: Initializing Pinecone with index: ${PINECONE_INDEX}`);
  pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY
    // Environment parameter is no longer needed with the latest Pinecone SDK
  });
  console.log('Preprocessor: Pinecone client initialized successfully');
} catch (error) {
  console.error('Preprocessor: Error initializing Pinecone client:', error);
}

/**
 * Main function to process CSV and upsert to Pinecone
 * @param {string} csvPath - Path to the CSV file
 * @returns {Promise<boolean>} - Success status
 */
async function processAndUpsertFreezoneData(csvPath) {
  try {
    console.log(`Starting to process data from ${csvPath}`);
    
    // 1. Read and preprocess CSV data
    const processedData = await preprocessFreezoneData(csvPath);
    
    // 2. Enrich the data with additional metadata
    const enrichedData = await enrichFreezoneData(processedData);
    
    // 3. Upsert the enriched data to Pinecone
    const result = await upsertFreezoneToPinecone(enrichedData);
    
    return result;
  } catch (error) {
    console.error('Error in processAndUpsertFreezoneData:', error);
    return false;
  }
}

/**
 * Reads and preprocesses the freezone CSV data
 * @param {string} csvPath - Path to CSV file
 * @returns {Promise<Array>} - Processed data array
 */
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

/**
 * Cleans and normalizes raw freezone data
 * @param {Object} rawData - Raw CSV row data
 * @returns {Object|null} - Cleaned data object or null if invalid
 */
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
  
  // Extract and normalize cost structures with better numeric handling
  // Use Number.parseFloat to handle various numeric formats and ensure NaN becomes 0
  const setupCost = normalizeNumericValue(rawData['Setup cost']);
  const renewalCost = normalizeNumericValue(rawData['Renewal cost']);
  const licenseFee = normalizeNumericValue(rawData['License fee']);
  const registrationFee = normalizeNumericValue(rawData['Registration fee']);
  const visaCost = normalizeNumericValue(rawData['Visa cost per visa']);
  const officeCost = normalizeNumericValue(rawData['Office cost']);
  const physicalOfficeCost = normalizeNumericValue(rawData['Physical office cost']);
  
  // Check for inconsistencies: if setup cost is less than sum of components, adjust it
  const calculatedCosts = licenseFee + registrationFee + (visaCost * visaCount) + officeCost;
  const finalSetupCost = setupCost > 0 ? setupCost : 
                         calculatedCosts > 0 ? calculatedCosts : 0;
  
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
  
  // Log cost processing for debugging
  console.log(`Processing costs for ${freezoneName} (${packageTitle}):
    - Raw setup cost: ${rawData['Setup cost']}
    - Normalized setup cost: ${setupCost}
    - Final setup cost: ${finalSetupCost}
    - License fee: ${licenseFee}
    - Registration fee: ${registrationFee}
    - Visa cost per visa: ${visaCost}
    - Office cost: ${officeCost}`);
  
  // Build a structured object with normalized and cleaned data
  return {
    freezoneName,
    packageName: packageTitle,
    location,
    costStructure: {
      setupCost: finalSetupCost,
      renewalCost: renewalCost || 0,
      licenseFee: licenseFee || 0,
      registrationFee: registrationFee || 0,
      visaCost: visaCost || 0,
      officeCost: officeCost || 0,
      officeDescription: rawData['Office description'] || '',
      physicalOfficeCost: physicalOfficeCost || 0,
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

/**
 * Helper function to normalize and parse numeric values from CSV
 * Handles various formats including currency symbols, commas, etc.
 * @param {string} value - The raw value from CSV
 * @returns {number} - Normalized numeric value
 */
function normalizeNumericValue(value) {
  if (!value) return 0;
  
  // Remove any non-numeric characters except decimals
  // This handles currency symbols, commas, spaces, etc.
  const cleanedValue = value.toString()
    .replace(/[^\d.-]/g, '')  // Keep only digits, decimal points, and negative signs
    .replace(/(\d),(\d)/g, '$1$2'); // Remove commas between digits
  
  const parsedValue = parseFloat(cleanedValue);
  return isNaN(parsedValue) ? 0 : parsedValue;
}

/**
 * Extracts freezone name from package title
 * @param {string} packageTitle - Package title
 * @returns {string} - Extracted freezone name
 */
function extractFreezoneNameFromPackage(packageTitle) {
  if (!packageTitle) return '';
  
  // Common pattern: "Freezone Name (Package Details)"
  const match = packageTitle.match(/^([^(]+)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return packageTitle;
}

/**
 * Extracts visa count from package title
 * @param {string} packageTitle - Package title
 * @returns {number} - Extracted visa count
 */
function extractVisaCountFromPackage(packageTitle) {
  if (!packageTitle) return 0;
  
  // Common pattern: "Freezone Name (X visa)"
  const match = packageTitle.match(/\((\d+)\s*visa\)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 0;
}

/**
 * Enriches freezone data with additional metadata
 * @param {Array} processedData - Processed freezone data
 * @returns {Promise<Array>} - Enriched data
 */
async function enrichFreezoneData(processedData) {
  // Categorize freezones by industry suitability
  const industryMapping = {
    'Technology': ['IFZA', 'DMCC', 'Dubai Internet City', 'Dubai Silicon Oasis'],
    'E-commerce': ['IFZA', 'DMCC', 'Dubai CommerCity'],
    'Trading': ['JAFZA', 'DAFZA', 'RAKEZ', 'SPCFZ'],
    'Consulting': ['IFZA', 'RAKEZ', 'Shams', 'Meydan'],
    'Manufacturing': ['JAFZA', 'KIZAD', 'RAKEZ'],
    'Logistics': ['JAFZA', 'DAFZA', 'SAIF Zone'],
    'Media': ['Shams', 'Dubai Media City', 'TwoFour54'],
    'Finance': ['DIFC', 'ADGM'],
    'Healthcare': ['Dubai Healthcare City', 'Dubai Science Park'],
    'Education': ['Dubai Knowledge Park', 'Academic City'],
    'Maritime': ['JAFZA', 'DMCC'],
    'Food & Beverage': ['Dubai Multi Commodities Centre', 'RAKEZ'],
    'Construction': ['RAKEZ', 'SPCFZ']
  };
  
  // Add industry suitability to each freezone
  return processedData.map(freezone => {
    // Find industries this freezone is suitable for
    const suitableIndustries = Object.entries(industryMapping)
      .filter(([_, freezones]) => 
        freezones.some(name => freezone.freezoneName.includes(name))
      )
      .map(([industry, _]) => industry);
    
    // Add the industry suitability
    return {
      ...freezone,
      industrySuitability: suitableIndustries
    };
  });
}

/**
 * Upserts the processed freezone data to Pinecone
 * @param {Array} processedData - Processed freezone data
 * @returns {Promise<boolean>} - Success status
 */
async function upsertFreezoneToPinecone(processedData) {
  try {
    // Get the index
    const index = pinecone.index(PINECONE_INDEX);
    
    // Create vectors with embeddings
    const vectors = await Promise.all(processedData.map(async (freezone, idx) => {
      // Create multiple embeddings for different aspects
      
      // 1. General embedding - covers all aspects
      const generalText = `
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
        Industry Suitability: ${freezone.industrySuitability.join(', ')}
      `;
      
      const generalEmbedding = await getEmbedding(generalText);
      
      return {
        id: `freezone-${freezone.freezoneName}-${freezone.visaInfo.initialAllocation}-${idx}`,
        values: generalEmbedding,
        metadata: freezone
      };
    }));
    
    // Upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert({
        vectors: batch
      });
      console.log(`Upserted batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(vectors.length/batchSize)}`);
    }
    
    console.log(`Successfully upserted ${vectors.length} freezone records to Pinecone`);
    return true;
  } catch (error) {
    console.error('Error upserting to Pinecone:', error);
    return false;
  }
}

/**
 * Gets embedding from OpenAI
 * @param {string} text - Text to embed
 * @returns {Promise<Array>} - Embedding vector
 */
async function getEmbedding(text) {
  try {
    console.log('Generating embedding for text...');
    
    // Use text-embedding-3-large model with 3072 dimensions for better accuracy
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      dimensions: 3072
    });
    
    console.log('Generated embedding successfully with dimension:', response.data[0].embedding.length);
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

// Export functions for use in other modules
module.exports = {
  processAndUpsertFreezoneData,
  preprocessFreezoneData,
  enrichFreezoneData,
  upsertFreezoneToPinecone,
  getEmbedding
}; 