require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAI } = require('openai');

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;
// PINECONE_ENVIRONMENT is no longer needed with the modern Pinecone API

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Initialize Pinecone with improved error handling
let pinecone;
try {
  console.log(`Initializing Pinecone with index: ${PINECONE_INDEX}`);
  console.log(`API Key prefix: ${PINECONE_API_KEY.substring(0, 10)}...`);
  
  pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY
    // Environment parameter is no longer needed with the latest Pinecone SDK
  });
  
  console.log('Pinecone client initialized successfully');
  
  // Test connection immediately to catch any auth issues
  (async () => {
    try {
      console.log('Testing Pinecone connection...');
      const indexes = await pinecone.listIndexes();
      console.log(`Available indexes: ${indexes.indexes.map(idx => idx.name).join(', ')}`);
      
      if (indexes.indexes.some(idx => idx.name === PINECONE_INDEX)) {
        console.log(`Found configured index "${PINECONE_INDEX}"`);
        const index = pinecone.index(PINECONE_INDEX);
        const stats = await index.describeIndexStats();
        console.log('Pinecone connection successful. Index stats:', stats);
      } else {
        console.warn(`Warning: Configured index "${PINECONE_INDEX}" not found in your account.`);
      }
    } catch (error) {
      console.error('Error testing Pinecone connection:', error);
    }
  })();
} catch (error) {
  console.error('Error initializing Pinecone client:', error);
  // Create a minimal mock client to prevent crashes when Pinecone is unavailable
  pinecone = {
    index: () => ({
      query: async () => {
        console.warn('Using mock Pinecone client - returning empty results');
        return { matches: [] };
      },
      upsert: async () => ({ upsertedCount: 0 }),
      describeIndexStats: async () => ({ dimension: 3072, indexFullness: 0, totalVectorCount: 0 })
    })
  };
}

// Step 1: Initial broad retrieval
async function initialRetrieval(userData) {
  try {
    const query = await constructBroadQuery(userData);
    
    // Get the index
    const index = pinecone.index(PINECONE_INDEX);
    
    // Query the index
    console.log('Querying Pinecone index for initial retrieval...');
    const initialResults = await index.query({
      vector: query.vector,
      topK: query.topK,
      includeMetadata: true
    });
    
    console.log(`Initial retrieval complete: ${initialResults.matches?.length || 0} matches found`);
    return initialResults;
  } catch (error) {
    console.error('Error in initialRetrieval:', error);
    return { matches: [] }; // Return empty results on error
  }
}

// Improved query construction for better semantic matching
async function constructBroadQuery(userData) {
  // Create a detailed, natural language description of what the user needs
  // This provides more context for the embedding model to work with
  const specificActivities = userData.specificActivities || userData.businessActivities || [];
  
  const detailedDescription = `
    Business in ${userData.industry || 'various industries'} 
    requiring ${userData.visaCount || 'multiple'} visas, 
    with a budget of ${userData.maxBudget || userData.budget || 'flexible'} AED,
    focused on ${specificActivities.join(', ') || 'various'} activities,
    preferring location in ${userData.preferredLocation || 'any location in UAE'},
    ${userData.needsPhysicalOffice ? 'needing physical office space' : 'flexible about office space'},
    planning to start within ${userData.timeline || 'standard timeframe'},
    with ${userData.employeeCount || 'unspecified number of'} employees.
  `;
  
  // Get embedding for this detailed description
  const embedding = await getEmbedding(detailedDescription);
  
  return {
    vector: embedding,
    topK: 15, // Increase from typical 5-10 to ensure we get good initial candidates
    includeMetadata: true
  };
}

// Get embedding using the latest OpenAI model
async function getEmbedding(text) {
  try {
    console.log('Generating embedding for query...');
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large", // Use the latest embedding model
      input: text,
      dimensions: 3072 // Match the dimension of your Pinecone index
    });
    
    console.log('Embedding generated successfully');
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

// Step 2: Refine results based on specific requirements
async function refinedRetrieval(initialResults, userData) {
  // Check if initialResults is in expected format
  if (!initialResults || !initialResults.matches || !Array.isArray(initialResults.matches)) {
    console.warn('Initial results not in expected format, returning empty array');
    return [];
  }
  
  console.log(`Refining ${initialResults.matches.length} initial results based on specific criteria`);
  
  // Extract specific user requirements for filtering with defaults
  const visaCount = userData.visaCount || 0;
  const maxBudget = userData.maxBudget || userData.budget || 100000;
  const specificActivities = userData.specificActivities || userData.businessActivities || [];
  
  // Filter initial results based on specific criteria
  const filteredResults = initialResults.matches.filter(match => {
    if (!match.metadata) {
      console.warn('Match missing metadata, skipping');
      return false;
    }
    
    const metadata = match.metadata;
    
    // Check visa allocation meets minimum requirement if visa count specified
    if (visaCount > 0) {
      const hasEnoughVisas = 
        (metadata.visaInfo && metadata.visaInfo.maxAllocation && metadata.visaInfo.maxAllocation >= visaCount) ||
        (metadata.maxVisas && metadata.maxVisas >= visaCount);
      
      if (!hasEnoughVisas) {
        console.log(`Filtering out ${metadata.freezoneName}: insufficient visa allocation`);
        return false;
      }
    }
    
    // Check budget is within range if budget specified
    if (maxBudget > 0) {
      const isBudgetCompatible = 
        (metadata.costStructure && metadata.costStructure.setupCost && metadata.costStructure.setupCost <= maxBudget * 1.2) ||
        (metadata.minimumCost && metadata.minimumCost <= maxBudget * 1.2) ||
        (metadata.averageCost && metadata.averageCost <= maxBudget * 1.2);
      
      if (!isBudgetCompatible) {
        console.log(`Filtering out ${metadata.freezoneName}: exceeds budget constraints`);
        return false;
      }
    }
    
    // Check all required activities are supported if activities specified
    if (specificActivities && specificActivities.length > 0) {
      const supportedActivitiesList = 
        (metadata.activities && metadata.activities.supportedActivities) || 
        metadata.supportedActivities || 
        [];
      
      const supportsAllActivities = specificActivities.every(
        activity => supportedActivitiesList.includes(activity)
      );
      
      if (!supportsAllActivities) {
        console.log(`Filtering out ${metadata.freezoneName}: does not support all required activities`);
        return false;
      }
    }
    
    return true;
  });
  
  console.log(`Refined to ${filteredResults.length} results after applying criteria`);
  return filteredResults;
}

// Step 3: Rank results by best match
function rankResults(refinedResults, userData) {
  // Check if refinedResults is in expected format
  if (!refinedResults || !Array.isArray(refinedResults) || refinedResults.length === 0) {
    console.warn('No refined results to rank, returning empty array');
    return [];
  }
  
  console.log(`Ranking ${refinedResults.length} refined results`);
  
  // Calculate match score for each result
  const scoredResults = refinedResults.map(result => {
    let score = 0;
    
    // Use score from Pinecone as initial boost if available
    if (result.score) {
      score += result.score * 10; // Give a small boost based on semantic similarity
    }
    
    const metadata = result.metadata;
    if (!metadata) {
      console.warn('Result missing metadata in ranking phase');
      return {
        ...result,
        matchScore: score,
        scoreDetails: { baseScore: score }
      };
    }
    
    // ---- ENHANCED SCORING ALGORITHM ----
    
    // 1. Cost matching (30% weight) - More nuanced approach
    let costScore = 0;
    const userBudget = userData.idealBudget || userData.budget || userData.maxBudget;
    
    if (userBudget) {
      const setupCost = metadata.costStructure?.setupCost || metadata.averageCost || 0;
      
      if (setupCost <= userBudget) {
        // If under budget, score higher the closer it is to budget (maximize value)
        costScore = 30 * (setupCost / userBudget);
      } else {
        // If over budget, penalize proportionally to how much it exceeds
        const overBudgetRatio = setupCost / userBudget;
        costScore = 30 * (1 / overBudgetRatio);
      }
    } else {
      // If no budget specified, give medium score
      costScore = 15;
    }
    
    score += costScore;
    
    // 2. Location preference (25% weight) - Add partial matching
    let locationScore = 0;
    if (metadata.location && userData.preferredLocation) {
      if (metadata.location === userData.preferredLocation) {
        locationScore = 25; // Exact match
      } else if (!userData.preferredLocation || userData.preferredLocation === 'Any') {
        locationScore = 20; // No preference, but still slightly penalize
      } else {
        // Partial matching for nearby areas (e.g., different areas in Dubai)
        const userLocationParts = userData.preferredLocation.toLowerCase().split(' ');
        const metadataLocationParts = metadata.location.toLowerCase().split(' ');
        
        // Check for any partial matches in location
        const hasPartialMatch = userLocationParts.some(part => 
          metadataLocationParts.includes(part) && part.length > 2
        );
        
        locationScore = hasPartialMatch ? 15 : 10;
      }
    } else {
      locationScore = 12; // Neutral score if location info not available
    }
    
    score += locationScore;
    
    // 3. Visa package matching (25% weight) - More sophisticated
    let visaScore = 0;
    const requiredVisas = userData.visaCount || 1;
    const maxVisas = metadata.visaInfo?.maxAllocation || metadata.maxVisas || 0;
    
    if (maxVisas >= requiredVisas) {
      // Give full score if exact match or close
      if (maxVisas <= requiredVisas + 2) {
        visaScore = 25;
      } else {
        // Penalize slightly for excessive visa allocation (might cost more)
        const visaRatio = (requiredVisas + 2) / maxVisas;
        visaScore = 25 * Math.min(1, visaRatio);
      }
    } else if (maxVisas > 0) {
      // If not enough visas, score based on how close
      visaScore = 25 * (maxVisas / requiredVisas);
    } else {
      visaScore = 10; // Default score if visa info not available
    }
    
    score += visaScore;
    
    // 4. Activity support (20% weight) - Enhanced
    let activityScore = 0;
    const requiredActivities = userData.specificActivities || userData.businessActivities || [];
    
    if (requiredActivities.length === 0) {
      // If no specific activities, give full score
      activityScore = 20;
    } else {
      // Get the supported activities from different possible locations in metadata
      const supportedActivities = 
        metadata.activities?.supportedActivities || 
        metadata.supportedActivities || 
        [];
      
      if (supportedActivities.length === 0) {
        activityScore = 10; // Default if no activity data available
      } else {
        // Check each activity and its importance
        const supportedActivitiesCount = requiredActivities.filter(
          activity => supportedActivities.includes(activity)
        ).length;
        
        // Weight by primary/secondary activities if available
        if (userData.primaryActivities && userData.primaryActivities.length > 0) {
          const primaryCount = userData.primaryActivities.length;
          const primarySupported = userData.primaryActivities.filter(
            activity => supportedActivities.includes(activity)
          ).length;
          
          // Primary activities are weighted double
          const primaryScore = (primarySupported / primaryCount) * 15;
          
          // Secondary activities get the remaining weight
          const secondaryActivities = requiredActivities.filter(
            act => !userData.primaryActivities.includes(act)
          );
          
          const secondaryScore = secondaryActivities.length > 0 
            ? (supportedActivitiesCount - primarySupported) / secondaryActivities.length * 5
            : 5;
          
          activityScore = primaryScore + secondaryScore;
        } else {
          // Equal weighting if no primary/secondary distinction
          activityScore = (supportedActivitiesCount / requiredActivities.length) * 20;
        }
      }
    }
    
    score += activityScore;
    
    // Calculate final score and return result with details
    return {
      ...result,
      matchScore: score,
      scoreDetails: {
        costScore,
        locationScore,
        visaScore,
        activityScore
      }
    };
  });
  
  // Sort by match score (descending)
  const sortedResults = scoredResults.sort((a, b) => b.matchScore - a.matchScore);
  console.log(`Ranked ${sortedResults.length} results, top score: ${sortedResults[0]?.matchScore || 'N/A'}`);
  
  return sortedResults;
}

// Main function to execute multi-stage retrieval
async function getOptimalFreezoneSuggestions(userData) {
  try {
    console.log('Starting multi-stage retrieval process for optimal freezone suggestions...');
    
    // Step 1: Initial broad retrieval
    const initialResults = await initialRetrieval(userData);
    
    // Step 2: Refine results based on specific criteria
    const refinedResults = await refinedRetrieval(initialResults, userData);
    
    // Step 3: Rank the refined results
    const rankedResults = rankResults(refinedResults, userData);
    
    // If no results found, return fallback suggestions
    if (!rankedResults || rankedResults.length === 0) {
      console.log('No ranked results available, generating fallback suggestions');
      return generateFallbackSuggestions(userData);
    }
    
    // Return top suggestions with detailed match reasoning
    const topSuggestions = rankedResults.slice(0, 3).map(result => {
      const freezoneName = result.metadata?.freezoneName || 
                          result.metadata?.name || 
                          'UAE Freezone';
                          
      return {
        freezoneName,
        matchScore: result.matchScore,
        matchReason: generateMatchReasoning(result, userData),
        details: result.metadata
      };
    });
    
    console.log(`Returning ${topSuggestions.length} top freezone suggestions`);
    return topSuggestions;
  } catch (error) {
    console.error('Error in getOptimalFreezoneSuggestions:', error);
    return generateFallbackSuggestions(userData);
  }
}

// Generate human-readable reasoning for why this freezone matches
function generateMatchReasoning(result, userData) {
  const metadata = result.metadata;
  const reasons = [];
  
  // Cost reasoning - Enhanced with more detailed breakdown
  if (metadata.costStructure && userData.budget) {
    const setupCost = metadata.costStructure.setupCost || 0;
    const userBudget = userData.budget || userData.maxBudget || userData.idealBudget || 0;
    
    const costDifference = setupCost - userBudget;
    const formattedSetupCost = setupCost.toLocaleString('en-US');
    
    if (Math.abs(costDifference) < userBudget * 0.1) {
      reasons.push(`Cost is within 10% of your budget (${formattedSetupCost} AED for full setup)`);
    } else if (costDifference < 0) {
      const savingsPercentage = Math.round((Math.abs(costDifference) / userBudget) * 100);
      reasons.push(`Cost is ${Math.abs(costDifference).toLocaleString('en-US')} AED below your budget (${savingsPercentage}% savings)`);
    } else {
      const overagePercentage = Math.round((costDifference / userBudget) * 100);
      reasons.push(`Cost is ${costDifference.toLocaleString('en-US')} AED above your budget (${overagePercentage}% more)`);
    }
    
    // Add breakdown of major cost components if available
    const licenseFee = metadata.costStructure.licenseFee || 0;
    const registrationFee = metadata.costStructure.registrationFee || 0;
    const visaCost = metadata.costStructure.visaCost || 0;
    
    if (licenseFee + registrationFee + visaCost > 0) {
      reasons.push(`Main cost components: License (${licenseFee.toLocaleString('en-US')} AED), Registration (${registrationFee.toLocaleString('en-US')} AED), Visa (${visaCost.toLocaleString('en-US')} AED per visa)`);
    }
    
    // Add information about renewal costs
    if (metadata.costStructure.renewalCost) {
      reasons.push(`Annual renewal cost: ${metadata.costStructure.renewalCost.toLocaleString('en-US')} AED`);
    }
  } else if (metadata.averageCost && userData.idealBudget) {
    // Fall back to average cost comparison if detailed cost structure isn't available
    const costDifference = metadata.averageCost - userData.idealBudget;
    if (Math.abs(costDifference) < userData.idealBudget * 0.1) {
      reasons.push(`Cost is within 10% of your budget (${metadata.averageCost.toLocaleString('en-US')} AED)`);
    } else if (costDifference < 0) {
      reasons.push(`Cost is below your budget by ${Math.abs(costDifference).toLocaleString('en-US')} AED`);
    } else {
      reasons.push(`Cost is above your budget by ${costDifference.toLocaleString('en-US')} AED`);
    }
  } else {
    reasons.push(`Cost information available upon consultation`);
  }
  
  // Visa reasoning
  if (metadata.visaInfo && metadata.visaInfo.maxAllocation && userData.visaCount) {
    if (metadata.visaInfo.maxAllocation >= userData.visaCount) {
      reasons.push(`Supports your requirement of ${userData.visaCount} visas (offers up to ${metadata.visaInfo.maxAllocation})`);
      
      // Add information about initial visa allocation if different from max
      if (metadata.visaInfo.initialAllocation && 
          metadata.visaInfo.initialAllocation < userData.visaCount && 
          metadata.visaInfo.maxAllocation >= userData.visaCount) {
        reasons.push(`Note: Initial allocation is ${metadata.visaInfo.initialAllocation} visas, additional visas require supplementary application`);
      }
    } else {
      reasons.push(`Limited visa allocation (max ${metadata.visaInfo.maxAllocation}), which is less than your requirement of ${userData.visaCount}`);
    }
  } else if (metadata.maxVisas && userData.visaCount) {
    if (metadata.maxVisas >= userData.visaCount) {
      reasons.push(`Supports your requirement of ${userData.visaCount} visas (offers up to ${metadata.maxVisas})`);
    } else {
      reasons.push(`Limited visa allocation (max ${metadata.maxVisas}), which is less than your requirement of ${userData.visaCount}`);
    }
  } else {
    reasons.push(`Visa allocation information available upon consultation`);
  }
  
  // Activities reasoning
  if (metadata.activities && metadata.activities.supportedActivities && userData.specificActivities) {
    const supportedActivities = userData.specificActivities.filter(
      activity => metadata.activities.supportedActivities.includes(activity)
    );
    
    if (supportedActivities.length === userData.specificActivities.length) {
      reasons.push(`Supports all your requested business activities`);
    } else {
      const unsupportedActivities = userData.specificActivities.filter(
        activity => !metadata.activities.supportedActivities.includes(activity)
      );
      reasons.push(`Supports ${supportedActivities.length} out of ${userData.specificActivities.length} requested activities. 
        Not supported: ${unsupportedActivities.join(', ')}`);
    }
  } else if (metadata.supportedActivities && userData.specificActivities) {
    const supportedActivities = userData.specificActivities.filter(
      activity => metadata.supportedActivities.includes(activity)
    );
    
    if (supportedActivities.length === userData.specificActivities.length) {
      reasons.push(`Supports all your requested business activities`);
    } else {
      const unsupportedActivities = userData.specificActivities.filter(
        activity => !metadata.supportedActivities.includes(activity)
      );
      reasons.push(`Supports ${supportedActivities.length} out of ${userData.specificActivities.length} requested activities. 
        Not supported: ${unsupportedActivities.join(', ')}`);
    }
  } else {
    reasons.push(`Business activity information available upon consultation`);
  }
  
  // Location reasoning
  if (metadata.location && userData.preferredLocation) {
    if (metadata.location === userData.preferredLocation) {
      reasons.push(`Located in your preferred area (${metadata.location})`);
    } else {
      reasons.push(`Located in ${metadata.location}, different from your preference of ${userData.preferredLocation}`);
    }
  } else {
    reasons.push(`Location information available upon consultation`);
  }
  
  return reasons;
}

// Get ranked freezone suggestions based on user requirements
async function getRankedFreezoneSuggestions(userData) {
  try {
    console.log('Starting freezone suggestion process...');
    console.log('User data received:', JSON.stringify(userData, null, 2));
    
    // Build user requirements vector
    const userRequirements = await buildUserRequirementsVector(userData);
    
    // Query Pinecone with robust error handling
    let freezoneMatches = [];
    try {
      // Get the index
      const index = pinecone.index(PINECONE_INDEX);
      
      // Prepare the query
      const queryOptions = {
        vector: userRequirements,
        topK: 10,
        includeMetadata: true
      };
      
      console.log('Querying Pinecone for freezone matches...');
      const queryResponse = await index.query(queryOptions);
      
      if (queryResponse.matches && queryResponse.matches.length > 0) {
        console.log(`Found ${queryResponse.matches.length} initial matches`);
        freezoneMatches = queryResponse.matches;
      } else {
        console.warn('No matches found in Pinecone query');
      }
    } catch (error) {
      console.error('Error querying Pinecone:', error);
      // Continue with empty matches - we'll provide fallbacks below
    }
    
    // Filter and rank the matches
    let rankedSuggestions = [];
    
    // If we have matches from Pinecone, rank them
    if (freezoneMatches.length > 0) {
      rankedSuggestions = freezoneMatches
        .filter(match => match.metadata)
        .map(match => {
          // Calculate a match score (base score + adjustments)
          const baseScore = match.score * 100; // Convert 0-1 score to 0-100
          
          // Create detailed match reason
          const matchReason = generateMatchReason(match.metadata, userData);
          
          return {
            freezoneName: match.metadata.freezoneName,
            details: match.metadata,
            matchScore: baseScore,
            scoreDetails: {
              baseScore: baseScore,
              // Add other score components if needed
            },
            matchReason
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);
    }
    
    // If no suggestions found or error occurred, provide fallback suggestions
    if (rankedSuggestions.length === 0) {
      console.log('No freezone suggestions found, providing fallback options');
      rankedSuggestions = generateFallbackSuggestions(userData);
    }
    
    console.log(`Returning ${rankedSuggestions.length} ranked suggestions`);
    return rankedSuggestions;
  } catch (error) {
    console.error('Error in getRankedFreezoneSuggestions:', error);
    // Return fallback suggestions in case of any error
    return generateFallbackSuggestions(userData);
  }
}

// Generate fallback suggestions when Pinecone query fails
function generateFallbackSuggestions(userData) {
  console.log('Generating fallback freezone suggestions');
  
  // Create some generic freezone options
  return [
    {
      freezoneName: "Dubai Multi Commodities Centre (DMCC)",
      details: {
        freezoneName: "Dubai Multi Commodities Centre (DMCC)",
        location: "Dubai",
        costStructure: {
          setupCost: 50000,
          renewalCost: 30000,
          licenseFee: 20000,
          registrationFee: 10000,
          visaCost: 5000,
          officeCost: 15000,
          officeDescription: "Flexi-desk and office spaces available",
          physicalOfficeCost: 25000,
          paymentOptions: ["Full payment", "Installment options available"]
        },
        visaInfo: {
          initialAllocation: 6,
          maxAllocation: 15,
          special: "Additional visas available based on office space"
        },
        setupTimeframe: {
          licenseIssuance: "3-5 business days",
          visaProcessingPerPerson: "5-7 business days",
          totalEstimate: "2-3 weeks",
          expediteOptions: ["Express processing available"]
        },
        keyBenefits: {
          points: [
            "100% foreign ownership",
            "0% corporate and personal tax",
            "Global business hub",
            "Excellent networking opportunities"
          ],
          activityFlexibility: true
        }
      },
      matchScore: 85,
      matchReason: ["Popular choice for international businesses", "Wide range of business activities supported"]
    },
    {
      freezoneName: "Sharjah Media City (SHAMS)",
      details: {
        freezoneName: "Sharjah Media City (SHAMS)",
        location: "Sharjah",
        costStructure: {
          setupCost: 25000,
          renewalCost: 15000,
          licenseFee: 12000,
          registrationFee: 5000,
          visaCost: 4000,
          officeCost: 8000,
          officeDescription: "Virtual office included in package",
          physicalOfficeCost: 15000,
          paymentOptions: ["Full payment", "Installment options available"]
        },
        visaInfo: {
          initialAllocation: 3,
          maxAllocation: 6,
          special: "Additional visa allocations require justification"
        },
        setupTimeframe: {
          licenseIssuance: "2-3 business days",
          visaProcessingPerPerson: "5-7 business days",
          totalEstimate: "2 weeks",
          expediteOptions: ["Express processing available"]
        },
        keyBenefits: {
          points: [
            "Cost-effective business setup",
            "100% foreign ownership",
            "0% corporate and personal tax",
            "Minimal paperwork"
          ],
          activityFlexibility: true
        }
      },
      matchScore: 80,
      matchReason: ["Budget-friendly option", "Quick setup process"]
    },
    {
      freezoneName: "Dubai Silicon Oasis",
      details: {
        freezoneName: "Dubai Silicon Oasis",
        location: "Dubai",
        costStructure: {
          setupCost: 35000,
          renewalCost: 25000,
          licenseFee: 15000,
          registrationFee: 8000,
          visaCost: 4500,
          officeCost: 12000,
          officeDescription: "Office spaces starting from 250 sq ft",
          physicalOfficeCost: 20000,
          paymentOptions: ["Full payment", "Installment options available"]
        },
        visaInfo: {
          initialAllocation: 5,
          maxAllocation: 12,
          special: "Additional visas based on office space"
        },
        setupTimeframe: {
          licenseIssuance: "3-4 business days",
          visaProcessingPerPerson: "5-7 business days",
          totalEstimate: "2-3 weeks",
          expediteOptions: ["Express processing available"]
        },
        keyBenefits: {
          points: [
            "Technology-focused environment",
            "Modern infrastructure",
            "100% foreign ownership",
            "0% corporate and personal tax"
          ],
          activityFlexibility: true
        }
      },
      matchScore: 75,
      matchReason: ["Ideal for technology businesses", "Excellent infrastructure"]
    }
  ];
}

// Export the necessary functions
module.exports = {
  getOptimalFreezoneSuggestions,
  initialRetrieval,
  refinedRetrieval,
  rankResults,
  generateMatchReasoning,
  getEmbedding,
  getRankedFreezoneSuggestions,
  generateFallbackSuggestions
};