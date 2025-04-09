require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAI } = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Update environment variable references
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;
// PINECONE_ENVIRONMENT is no longer needed with the modern API

// Set up Pinecone with better connection handling
let pinecone;
try {
  console.log(`Initializing Pinecone with index: ${PINECONE_INDEX}`);
  console.log(`API Key prefix: ${PINECONE_API_KEY.substring(0, 10)}...`);
  
  pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY
    // Environment parameter is no longer needed with the latest Pinecone SDK
  });
  
  console.log('Pinecone client initialized successfully');
  
  // Test connection immediately to catch any issues
  (async () => {
    try {
      const indexes = await pinecone.listIndexes();
      if (indexes.indexes && indexes.indexes.some(idx => idx.name === PINECONE_INDEX)) {
        console.log(`Found configured index "${PINECONE_INDEX}"`);
      } else {
        console.warn(`Warning: Configured index "${PINECONE_INDEX}" may not exist in your account.`);
      }
    } catch (error) {
      console.error('Error checking Pinecone indexes:', error);
    }
  })();
} catch (error) {
  console.error('Error initializing Pinecone client:', error);
  // Create a minimal mock client to prevent crashes when Pinecone is unavailable
  pinecone = {
    index: () => ({
      query: async () => ({ matches: [] }),
      upsert: async () => ({ upsertedCount: 0 })
    })
  };
}

// Generate a personalized proposal based on user data and ranked suggestions
async function generateProposal(userData, rankedFreezoneSuggestions) {
  try {
    console.log('Starting proposal generation...');
    console.log('User data received:', JSON.stringify(userData, null, 2));
    console.log('Ranked suggestions received:', JSON.stringify(rankedFreezoneSuggestions, null, 2));
    
    // Validate input data
    if (!userData) {
      throw new Error('No user data provided for proposal generation');
    }
    
    if (!rankedFreezoneSuggestions || !Array.isArray(rankedFreezoneSuggestions) || rankedFreezoneSuggestions.length === 0) {
      throw new Error('No freezone suggestions available for proposal generation');
    }
    
    const topMatch = rankedFreezoneSuggestions[0];
    
    // Extract alternatives (positions 2-4 if available)
    const alternatives = rankedFreezoneSuggestions.slice(1, 4);
    
    // Generate each section of the proposal
    console.log('Generating introduction...');
    const introduction = generateIntroduction(userData);
    
    console.log('Generating primary recommendation...');
    const primaryRecommendation = await generatePrimaryRecommendation(userData, topMatch);
    
    console.log('Generating alternative options...');
    const alternativeOptions = await generateAlternativeOptions(userData, alternatives, topMatch);
    
    console.log('Generating cost breakdown...');
    const costBreakdown = generateCostBreakdown(userData, topMatch);
    
    console.log('Generating timeline...');
    const timeline = generateTimeline(userData, topMatch);
    
    console.log('Generating FAQ section...');
    const faqSection = generateFAQSection(userData, topMatch);
    
    console.log('Generating next steps...');
    const nextSteps = generateNextSteps(userData, topMatch);
    
    // Assemble complete proposal
    const proposal = {
      introduction,
      primaryRecommendation,
      alternativeOptions,
      costBreakdown,
      timeline,
      faqSection,
      nextSteps
    };
    
    console.log('Proposal generation completed successfully');
    return proposal;
  } catch (error) {
    console.error('Error in generateProposal:', error);
    
    // Return a fallback proposal with error information
    return {
      introduction: {
        heading: "Executive Summary",
        content: "Thank you for your interest in establishing a business in the UAE. We've prepared a general overview of business setup options based on typical requirements."
      },
      primaryRecommendation: {
        heading: "Primary Recommendation",
        freezoneName: "UAE Freezone",
        description: "We're currently experiencing technical difficulties in generating your personalized recommendation. Our team will contact you shortly to discuss suitable freezone options for your specific needs.",
        businessActivities: ["General Trading", "Consulting"],
        visaAllocation: "Multiple options available",
        legalStructure: "Free Zone Company (FZC)",
        advantages: [
          "Strategic location with global connectivity",
          "100% foreign ownership",
          "0% corporate and personal tax",
          "Full repatriation of capital and profits"
        ]
      },
      alternativeOptions: {
        heading: "Alternative Options",
        description: "Several alternative freezones are available based on your business requirements. Our consultants can provide detailed comparisons during your consultation.",
        alternatives: []
      },
      costBreakdown: generateDefaultCostBreakdown(),
      timeline: generateDefaultTimeline(),
      faqSection: generateDefaultFAQSection(),
      nextSteps: {
        heading: "Next Steps",
        steps: [
          {
            step: "Schedule Consultation",
            description: "Book a 30-minute consultation to discuss your business setup options in detail"
          },
          {
            step: "Document Collection",
            description: "Prepare necessary documentation for business registration"
          },
          {
            step: "Application Submission",
            description: "Submit application to your chosen freezone authority"
          },
          {
            step: "Payment Processing",
            description: "Process initial fees to begin incorporation"
          }
        ],
        contactInformation: {
          consultantName: "Zola Business Consultants",
          email: "support@zola.ae",
          phone: "+971-X-XXX-XXXX"
        }
      }
    };
  }
}

// Generate personalized introduction
function generateIntroduction(userData) {
  try {
    // Use user's specific requirements to personalize introduction
    const businessGoals = userData && userData.businessGoals ? userData.businessGoals : 'establishing your business in the UAE';
    const timeline = userData && userData.desiredTimeline ? userData.desiredTimeline : 'as efficiently as possible';
    const industry = userData && userData.industry ? userData.industry : 'your industry';
    
    // Add specific industry knowledge if available
    let industryInsight = '';
    if (userData && userData.industry) {
      const industryLower = userData.industry.toLowerCase();
      if (industryLower.includes('tech')) {
        industryInsight = `As a technology business, you'll benefit from UAE's growing tech ecosystem and digital infrastructure.`;
      } else if (industryLower.includes('trade') || industryLower.includes('import') || industryLower.includes('export')) {
        industryInsight = `As a trading business, you'll benefit from UAE's strategic location and excellent logistics infrastructure connecting Asia, Europe, and Africa.`;
      } else if (industryLower.includes('consult')) {
        industryInsight = `For your consulting business, UAE offers access to a diverse client base of international corporations and local enterprises.`;
      }
    }
    
    const budget = userData && userData.budget ? `${userData.budget} AED` : 'your planned investment';
    const visaCount = userData && userData.visaCount ? `${userData.visaCount} visas` : 'the visas you require';
    const activities = userData && userData.businessActivities && userData.businessActivities.length > 0 
      ? userData.businessActivities.join(', ') 
      : 'your business activities';
    
    return {
      heading: "Executive Summary",
      content: `Based on your specific requirements for ${businessGoals} in ${industry}, we've analyzed all UAE freezones to identify the optimal solution for your business incorporation needs.

This proposal outlines our recommendations, tailored to your budget of ${budget}, requirement for ${visaCount}, and focus on ${activities}. ${industryInsight}

Our goal is to help you establish your business ${timeline} while meeting all your key requirements and regulatory considerations.`
    };
  } catch (error) {
    console.error("Error in generateIntroduction:", error);
    return {
      heading: "Executive Summary",
      content: `Thank you for your interest in establishing a business in the UAE. Based on your requirements, we've analyzed the available freezones to find the most suitable options for your business incorporation needs.

Our proposal outlines the recommended freezones, cost breakdowns, visa options, and implementation timelines to help you make an informed decision.

Our goal is to help you establish your business efficiently while meeting your key requirements and regulatory considerations.`
    };
  }
}

// Generate primary recommendation with detailed reasoning
async function generatePrimaryRecommendation(userData, topMatch) {
  try {
    // Extract metadata for clearer presentation
    const { freezoneName, details, matchScore, scoreDetails } = topMatch;
    const { costStructure, visaInfo, setupTimeframe, keyBenefits, location } = details;
    
    // Enhance with OpenAI to generate more natural language explanations
    let enhancedDescription;
    try {
      enhancedDescription = await generateEnhancedFreezoneDescription(
        freezoneName, 
        details, 
        userData,
        scoreDetails
      );
    } catch (error) {
      console.error("Error generating enhanced description:", error);
      enhancedDescription = `${freezoneName} is our top recommendation based on your requirements for ${userData.businessGoals || 'your business'}.`;
    }
    
    // Generate separate paragraphs for each key aspect of the recommendation
    const costParagraph = `The ${freezoneName} freezone offers a setup cost of approximately ${costStructure.setupCost || 'N/A'} AED with annual renewal fees of ${costStructure.renewalCost || 'N/A'} AED, which ${(costStructure.setupCost && userData.budget && costStructure.setupCost <= userData.budget) ? 'fits within' : 'may exceed'} your specified budget${userData.budget ? ' of ' + userData.budget + ' AED' : ''}.`;
    
    const visaParagraph = `You'll receive ${visaInfo.initialAllocation || 'a number of'} visa allocations initially${(visaInfo.initialAllocation && userData.visaCount && visaInfo.initialAllocation >= userData.visaCount) ? ', which meets your requirement of ' + userData.visaCount + ' visas' : ', and can apply for additional allocations if needed'}.`;
    
    const activitiesParagraph = `This freezone supports ${userData.businessActivities && userData.businessActivities.length > 0 ? 'your required business activities, including ' + userData.businessActivities.join(', ') : 'a wide range of business activities'}${keyBenefits && keyBenefits.activityFlexibility ? ', and offers flexibility to add more activities in the future.' : '.'}`;
    
    const locationParagraph = `Located in ${location || 'the UAE'}, this freezone ${(location && userData.preferredLocation && location === userData.preferredLocation) ? 'matches your preferred location' : 'offers excellent facilities'}.`;
    
    // Add industry-specific benefits
    let industryBenefits = '';
    if (userData.industry && details.industrySuitability && details.industrySuitability.includes(userData.industry)) {
      industryBenefits = `\n\nThis freezone is particularly well-suited for ${userData.industry} businesses, with specialized infrastructure and support services for your industry.`;
    }
    
    return {
      heading: `Primary Recommendation: ${freezoneName} Freezone`,
      content: [
        enhancedDescription,
        costParagraph, 
        visaParagraph, 
        activitiesParagraph, 
        locationParagraph + industryBenefits
      ],
      matchReasons: topMatch.matchReason || ['Matches your business requirements'],
      keyBenefits: (keyBenefits && keyBenefits.points) || ['Streamlined business setup', 'Strategic location', 'Supportive business environment'],
      matchScore: matchScore ? Math.round(matchScore) : 85
    };
  } catch (error) {
    console.error("Error in generatePrimaryRecommendation:", error);
    return {
      heading: `Recommended: ${topMatch.freezoneName || 'UAE Freezone'}`,
      content: [
        `Based on your requirements, we've identified a suitable freezone option for your business needs.`,
        `The proposal includes estimated costs, visa information, and business activity support details.`
      ],
      matchReasons: ['Matches your business requirements'],
      keyBenefits: ['Streamlined business setup', 'Strategic location', 'Supportive business environment'],
      matchScore: 75
    };
  }
}

// Generate enhanced freezone description using OpenAI
async function generateEnhancedFreezoneDescription(freezoneName, details, userData, scoreDetails) {
  try {
    // Fallback in case of early errors
    if (!freezoneName) {
      return "This freezone is our recommendation based on your requirements.";
    }
    
    // Prepare context for the AI to understand what's important to this user
    const userContext = `
      User industry: ${userData.industry || 'Not specified'}
      User visa requirements: ${userData.visaCount || 'Not specified'} visas
      User budget: ${userData.budget || 'Not specified'} AED
      User business activities: ${(userData.businessActivities && userData.businessActivities.length > 0) ? userData.businessActivities.join(', ') : 'Not specified'}
      User location preference: ${userData.preferredLocation || 'No preference'}
      Business goals: ${userData.businessGoals || 'Not specified'}
    `;
    
    // Prepare freezone details with null checks
    const freezoneInfo = `
      Freezone name: ${freezoneName}
      Location: ${details.location || 'UAE'}
      Setup cost: ${details.costStructure?.setupCost || 'N/A'} AED
      Renewal cost: ${details.costStructure?.renewalCost || 'N/A'} AED
      Visa allocation: ${details.visaInfo?.initialAllocation || 'N/A'} initially, max ${details.visaInfo?.maxAllocation || 'N/A'}
      Setup timeframe: ${details.setupTimeframe?.totalEstimate || 'Not specified'}
      Key benefits: ${(details.keyBenefits && details.keyBenefits.points) ? details.keyBenefits.points.join(', ') : 'Not specified'}
      Activity flexibility: ${(details.keyBenefits && details.keyBenefits.activityFlexibility) ? 'High' : 'Standard'}
    `;
    
    // Add a timeout promise to avoid waiting too long for the API
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('OpenAI API request timeout')), 10000)
    );
    
    // Generate a personalized description
    const responsePromise = openai.chat.completions.create({
      model: "o3-mini-2025-01-31",
      messages: [
        {
          role: "system",
          content: "You are a UAE business setup expert. Generate a concise, personalized description of why this freezone is a good match for the client. Focus on the most relevant benefits for their specific needs. Keep it to 2-3 sentences maximum."
        },
        {
          role: "user",
          content: `${userContext}\n\n${freezoneInfo}`
        }
      ],
      max_tokens: 150
    });
    
    // Race the OpenAI call against the timeout
    const response = await Promise.race([responsePromise, timeoutPromise]);
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating enhanced description:", error);
    // Return a reasonable fallback that doesn't expose the error
    return `${freezoneName} is recommended based on your business requirements, offering a balance of cost efficiency, visa allocation, and operational flexibility.`;
  }
}

// Generate new FAQ section based on user profile
function generateFAQSection(userData, recommendation) {
  try {
    if (!recommendation || !recommendation.freezoneName) {
      return generateDefaultFAQSection(userData);
    }
    
    // Create FAQs based on user data and selected freezone
    const faqs = [
      {
        question: `What is the process for obtaining ${userData.visaCount || 'employment'} visas in ${recommendation.freezoneName}?`,
        answer: `For ${recommendation.freezoneName}, the visa process typically takes ${recommendation.details?.setupTimeframe?.visaProcessingPerPerson || '5-7 days'} per person. You'll need to submit passport copies, completed visa applications, and medical test results for each employee. The freezone offers ${recommendation.details?.visaInfo?.initialAllocation || 'several'} visas initially${recommendation.details?.visaInfo?.initialAllocation && userData.visaCount && recommendation.details.visaInfo.initialAllocation >= userData.visaCount ? ', which meets your requirement' : ', and you can apply for additional allocations if needed'}.`
      },
      {
        question: `How does the cost breakdown compare to other freezones?`,
        answer: `${recommendation.freezoneName}'s setup cost (${recommendation.details?.costStructure?.setupCost || 'varies'} AED) is ${recommendation.scoreDetails?.costScore > 20 ? 'very competitive' : 'relatively standard'} compared to other freezones. The renewal fees (${recommendation.details?.costStructure?.renewalCost || 'vary'} AED annually) are also ${recommendation.details?.costStructure?.renewalCost && recommendation.details.costStructure.renewalCost < 15000 ? 'lower than average' : 'in line with market rates'}.`
      },
      {
        question: `What are the office space options in ${recommendation.freezoneName}?`,
        answer: `${recommendation.freezoneName} offers ${recommendation.details?.costStructure?.officeDescription || 'various office solutions including virtual offices, flexi-desks, and physical office spaces'}. ${userData.needsPhysicalOffice ? 'For your physical office requirements, they provide dedicated office spaces starting from ' + (recommendation.details?.costStructure?.physicalOfficeCost || '20,000') + ' AED annually.' : 'Their virtual office package would be sufficient for your current needs, included in the base package cost.'}`
      },
      {
        question: `How long will the entire setup process take?`,
        answer: `Based on your requirements, the complete setup process in ${recommendation.freezoneName} from application to operating business takes approximately ${recommendation.details?.setupTimeframe?.totalEstimate || '3-4 weeks'}. This includes license issuance (${recommendation.details?.setupTimeframe?.licenseIssuance || '2-3 days'}), visa processing for ${userData.visaCount || 'your employees'}, and bank account setup (${recommendation.details?.setupTimeframe?.bankAccountSetup || '7-14 days'}).`
      }
    ];
    
    // Add industry-specific FAQ if relevant
    if (userData && userData.industry) {
      faqs.push({
        question: `Are there any special considerations for ${userData.industry} businesses in ${recommendation.freezoneName}?`,
        answer: `${recommendation.freezoneName} ${recommendation.details?.industrySuitability && recommendation.details.industrySuitability.includes(userData.industry) ? 'is particularly well-suited for ' + userData.industry + ' businesses, with specialized support and networking opportunities in this sector.' : 'accommodates ' + userData.industry + ' businesses, though it\'s not specifically focused on this industry. You\'ll still receive all standard freezone benefits.'}`
      });
    }
    
    return {
      heading: "Frequently Asked Questions",
      faqs: faqs
    };
  } catch (error) {
    console.error("Error in generateFAQSection:", error);
    return generateDefaultFAQSection(userData);
  }
}

// Generate default FAQ section when an error occurs
function generateDefaultFAQSection(userData) {
  return {
    heading: "Frequently Asked Questions",
    faqs: [
      {
        question: "What documents are required to set up a business in a UAE freezone?",
        answer: "Typically, you'll need passport copies of all shareholders, completed application forms, a business plan, and proof of address. Specific requirements may vary by freezone."
      },
      {
        question: "How long does the business setup process take?",
        answer: "The average setup time for a freezone company in the UAE is 2-4 weeks, including license issuance and initial visa processing."
      },
      {
        question: "What's the difference between mainland and freezone companies?",
        answer: "Freezone companies offer 100% foreign ownership, tax exemptions, and simplified procedures, but have some limitations on conducting business within the UAE mainland without a local service agent."
      },
      {
        question: "Can I upgrade my package later if my business grows?",
        answer: "Yes, most freezones offer flexibility to upgrade your visa allocation, office space, and other services as your business expands."
      }
    ]
  };
}

// Generate alternative options with comparison to primary recommendation
async function generateAlternativeOptions(userData, alternatives, topMatch) {
  try {
    if (!alternatives || !Array.isArray(alternatives) || alternatives.length === 0) {
      return {
        heading: "Alternative Options",
        content: "No suitable alternatives found that match your specific requirements."
      };
    }
    
    const alternativeSections = await Promise.all(alternatives.map(async (alt, index) => {
      try {
        if (!alt || !alt.freezoneName || !alt.details) {
          throw new Error(`Invalid alternative data at index ${index}`);
        }
        
        // Generate comparative analysis
        const comparisonPoints = [
          {
            aspect: "Cost",
            difference: compareCost(alt.details.costStructure || {}, userData.budget)
          },
          {
            aspect: "Visa Allocation",
            difference: compareVisaAllocation(alt.details.visaInfo || {}, userData.visaCount)
          },
          {
            aspect: "Location",
            difference: compareLocation(alt.details.location, userData.preferredLocation)
          },
          {
            aspect: "Business Activities",
            difference: compareActivities(
              (alt.details.activities && alt.details.activities.supportedActivities) || [],
              userData.businessActivities || []
            )
          }
        ];
        
        // Enhance with OpenAI to generate more natural language explanations
        let enhancedDescription;
        try {
          enhancedDescription = await generateEnhancedAlternativeDescription(
            alt.freezoneName, 
            alt.details, 
            userData,
            comparisonPoints
          );
        } catch (error) {
          console.error(`Error generating enhanced description for alternative ${index}:`, error);
          enhancedDescription = `${alt.freezoneName} is an alternative option that may also be suitable for your business requirements.`;
        }
        
        return {
          name: alt.freezoneName,
          matchScore: alt.matchScore || 70,
          matchReasons: alt.matchReason || [`Alternative option for ${userData.industry || 'your business'}`],
          comparisonPoints,
          enhancedDescription
        };
      } catch (error) {
        console.error(`Error processing alternative ${index}:`, error);
        return {
          name: alt.freezoneName || `Alternative ${index + 1}`,
          matchScore: 65,
          matchReasons: [`Alternative option for ${userData.industry || 'your business'}`],
          comparisonPoints: [
            { aspect: "General", difference: "This is an alternative option to consider" }
          ],
          enhancedDescription: "This is an alternative freezone option that may be suitable for your business needs."
        };
      }
    }));
    
    return {
      heading: "Alternative Options",
      alternatives: alternativeSections
    };
  } catch (error) {
    console.error("Error in generateAlternativeOptions:", error);
    return {
      heading: "Alternative Options",
      content: "We're currently analyzing additional options for your business. Please check back later for alternatives."
    };
  }
}

// Generate enhanced alternative description using OpenAI
async function generateEnhancedAlternativeDescription(freezoneName, details, userData, comparisonPoints) {
  try {
    if (!freezoneName) {
      return "This is an alternative freezone option to consider.";
    }
    
    // Prepare context for the AI
    const userContext = `
      User industry: ${userData.industry || 'Not specified'}
      User visa requirements: ${userData.visaCount || 'Not specified'} visas
      User budget: ${userData.budget || 'Not specified'} AED
      User business activities: ${(userData.businessActivities && userData.businessActivities.length > 0) ? userData.businessActivities.join(', ') : 'Not specified'}
      User location preference: ${userData.preferredLocation || 'No preference'}
    `;
    
    // Prepare comparison points in a readable format
    const comparisonInfo = comparisonPoints.map(point => 
      `${point.aspect}: ${point.difference}`
    ).join('\n');
    
    // Add a timeout promise to avoid waiting too long for the API
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('OpenAI API request timeout')), 10000)
    );
    
    // Generate a personalized alternative description
    const responsePromise = openai.chat.completions.create({
      model: "o3-mini-2025-01-31",
      messages: [
        {
          role: "system",
          content: "You are a UAE business setup expert. Generate a brief comparison of how this alternative freezone compares to the primary recommendation. Focus on key differences and when this might be a better choice. Keep it to 1-2 sentences."
        },
        {
          role: "user",
          content: `${userContext}\n\nFreezone name: ${freezoneName}\n\nComparison points:\n${comparisonInfo}`
        }
      ],
      max_tokens: 100
    });
    
    // Race the OpenAI call against the timeout
    const response = await Promise.race([responsePromise, timeoutPromise]);
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating alternative description:", error);
    return `${freezoneName} offers an alternative approach to business setup in the UAE with different cost structures and visa allocations that might suit different business needs.`;
  }
}

// Helper functions for comparisons
function compareCost(costStructure, budget) {
  try {
    if (!costStructure || !costStructure.setupCost || !budget) {
      return "Cost information available upon request";
    }
    
    const difference = costStructure.setupCost - budget;
    if (Math.abs(difference) < budget * 0.1) {
      return `Similar to your budget (${difference > 0 ? '+' : ''}${difference} AED)`;
    } else if (difference < 0) {
      return `${Math.abs(difference)} AED lower than your budget`;
    } else {
      return `${difference} AED higher than your budget`;
    }
  } catch (error) {
    console.error("Error in compareCost:", error);
    return "Cost comparison available upon request";
  }
}

function compareVisaAllocation(visaInfo, requiredCount) {
  try {
    if (!visaInfo || typeof visaInfo.initialAllocation === 'undefined' || !requiredCount) {
      return "Visa allocation details available upon request";
    }
    
    if (visaInfo.initialAllocation >= requiredCount) {
      return `Meets your requirement of ${requiredCount} visas`;
    } else if (visaInfo.maxAllocation >= requiredCount) {
      return `Initial allocation (${visaInfo.initialAllocation}) is below your requirement, but can be increased up to ${visaInfo.maxAllocation}`;
    } else {
      return `Maximum allocation (${visaInfo.maxAllocation}) is below your requirement of ${requiredCount}`;
    }
  } catch (error) {
    console.error("Error in compareVisaAllocation:", error);
    return "Visa allocation details available upon request";
  }
}

function compareLocation(location, preferredLocation) {
  try {
    if (!location || !preferredLocation) {
      return "Location details available upon request";
    }
    
    if (location === preferredLocation) {
      return `Matches your preferred location`;
    } else {
      return `Located in ${location} instead of your preferred ${preferredLocation}`;
    }
  } catch (error) {
    console.error("Error in compareLocation:", error);
    return "Location comparison available upon request";
  }
}

function compareActivities(supportedActivities, requiredActivities) {
  try {
    if (!Array.isArray(supportedActivities) || !Array.isArray(requiredActivities) || 
        supportedActivities.length === 0 || requiredActivities.length === 0) {
      return "Activity support details available upon request";
    }
    
    const supported = requiredActivities.filter(act => supportedActivities.includes(act));
    if (supported.length === requiredActivities.length) {
      return `Supports all your required activities`;
    } else {
      const unsupported = requiredActivities.filter(act => !supportedActivities.includes(act));
      return `Supports ${supported.length} out of ${requiredActivities.length} required activities. Not supported: ${unsupported.join(', ')}`;
    }
  } catch (error) {
    console.error("Error in compareActivities:", error);
    return "Activity support details available upon request";
  }
}

// Generate detailed cost breakdown
function generateCostBreakdown(userData, recommendation) {
  try {
    console.log('Generating cost breakdown with recommendation data:', JSON.stringify(recommendation, null, 2));
    
    if (!recommendation || !recommendation.details || !recommendation.details.costStructure) {
      console.warn('Missing cost structure in recommendation, using default cost breakdown');
      return generateDefaultCostBreakdown(userData);
    }
    
    const { costStructure } = recommendation.details;
    console.log('Using cost structure:', JSON.stringify(costStructure, null, 2));
    
    // Ensure all cost values are properly parsed as numbers with fallbacks
    const licenseFee = parseFloat(costStructure.licenseFee) || 0;
    const registrationFee = parseFloat(costStructure.registrationFee) || 0;
    const visaCost = parseFloat(costStructure.visaCost) || 0;
    const officeCost = parseFloat(costStructure.officeCost) || 0;
    const physicalOfficeCost = parseFloat(costStructure.physicalOfficeCost) || 0;
    const setupCost = parseFloat(costStructure.setupCost) || 0;
    const renewalCost = parseFloat(costStructure.renewalCost) || 0;
    
    // Check if total setup cost is provided but individual costs are missing
    let useSetupCostBreakdown = false;
    
    // If the CSV provided a total setup cost but not detailed breakdown, distribute the cost
    if (setupCost > 0 && (licenseFee + registrationFee + visaCost + officeCost) < setupCost * 0.7) {
      useSetupCostBreakdown = true;
      console.log('Using total setup cost to distribute costs');
    }
    
    // Create itemized list of costs
    let costItems = [];
    
    if (useSetupCostBreakdown) {
      // Distribute the setup cost across typical categories if detailed breakdown is missing
      const visaCount = userData.visaCount || 1;
      const estimatedLicenseFee = setupCost * 0.4; // 40% for license
      const estimatedRegistrationFee = setupCost * 0.15; // 15% for registration
      const estimatedVisaTotal = setupCost * 0.25; // 25% for visas
      const estimatedOfficeCost = setupCost * 0.2; // 20% for office
      
      costItems = [
        {
          item: "License Fee",
          amount: Math.round(estimatedLicenseFee),
          description: "Annual business license fee (estimated from total setup cost)"
        },
        {
          item: "Registration Fee",
          amount: Math.round(estimatedRegistrationFee),
          description: "One-time business registration (estimated from total setup cost)"
        },
        {
          item: "Visa Costs",
          amount: Math.round(estimatedVisaTotal),
          description: `${visaCount} visa package${visaCount !== 1 ? 's' : ''} (estimated from total setup cost)`
        },
        {
          item: "Office Space",
          amount: Math.round(estimatedOfficeCost),
          description: costStructure.officeDescription || "Standard office package (estimated from total setup cost)"
        }
      ];
    } else {
      // Use the detailed breakdown from the CSV/Pinecone data
      costItems = [
        {
          item: "License Fee",
          amount: licenseFee,
          description: "Annual business license fee"
        },
        {
          item: "Registration Fee",
          amount: registrationFee,
          description: "One-time business registration"
        },
        {
          item: "Visa Costs",
          amount: visaCost * (userData.visaCount || 1),
          description: `${userData.visaCount || 1} visa package${userData.visaCount !== 1 ? 's' : ''} at ${visaCost} AED each`
        },
        {
          item: "Office Space",
          amount: officeCost,
          description: costStructure.officeDescription || "Standard office package"
        }
      ];
    }
    
    // Add physical office cost if needed
    if (userData.needsPhysicalOffice && physicalOfficeCost > 0) {
      costItems.push({
        item: "Physical Office Setup",
        amount: physicalOfficeCost,
        description: "Setup of physical office space"
      });
    }
    
    // Calculate totals
    const calculatedTotal = costItems.reduce((sum, item) => sum + item.amount, 0);
    
    // Use the setup cost from CSV if it's higher than our calculated total
    // This ensures we don't underestimate costs
    const initialTotal = setupCost > calculatedTotal ? setupCost : calculatedTotal;
    
    return {
      heading: "Cost Breakdown",
      costItems,
      initialTotal,
      annualRenewalTotal: renewalCost || initialTotal * 0.6, // Use renewal cost from CSV or estimate as 60% of initial cost
      paymentOptions: costStructure.paymentOptions || ["Full payment", "Installment options available"],
      sourceInfo: useSetupCostBreakdown 
        ? "* Detailed costs are estimated based on total setup cost provided in our database."
        : "* Costs are based on current freezone fee structures and may be subject to change."
    };
  } catch (error) {
    console.error("Error in generateCostBreakdown:", error);
    return generateDefaultCostBreakdown(userData);
  }
}

// Generate default cost breakdown when an error occurs
function generateDefaultCostBreakdown(userData) {
  const visaCount = userData?.visaCount || 1;
  return {
    heading: "Estimated Cost Breakdown",
    costItems: [
      {
        item: "License Fee",
        amount: 10000,
        description: "Estimated annual business license fee"
      },
      {
        item: "Registration Fee",
        amount: 5000,
        description: "Estimated one-time business registration"
      },
      {
        item: "Visa Costs",
        amount: 3000 * visaCount,
        description: `Estimated cost for ${visaCount} visa package${visaCount !== 1 ? 's' : ''}`
      },
      {
        item: "Office Space",
        amount: 8000,
        description: "Estimated office package cost"
      }
    ],
    initialTotal: 10000 + 5000 + (3000 * visaCount) + 8000,
    annualRenewalTotal: 15000,
    paymentOptions: ["Full payment", "Installment options available"],
    disclaimer: "These are estimated costs. Actual costs will be confirmed during consultation."
  };
}

// Generate implementation timeline
function generateTimeline(userData, recommendation) {
  try {
    if (!recommendation || !recommendation.details || !recommendation.details.setupTimeframe) {
      return generateDefaultTimeline(userData);
    }
    
    const { setupTimeframe } = recommendation.details;
    
    // Create timeline stages
    const timelineStages = [
      {
        stage: "Application Submission",
        duration: setupTimeframe.applicationProcessing || "1-2 days",
        description: "Submission of all required documents and forms"
      },
      {
        stage: "Initial Approval",
        duration: setupTimeframe.initialApproval || "3-5 days",
        description: "Review and initial approval of business application"
      },
      {
        stage: "License Issuance",
        duration: setupTimeframe.licenseIssuance || "2-3 days",
        description: "Issuance of business license after approval"
      },
      {
        stage: "Visa Processing",
        duration: `${setupTimeframe.visaProcessingPerPerson || "5-7 days"} per person`,
        description: `Processing of ${userData.visaCount || 1} employment visa${userData.visaCount !== 1 ? 's' : ''}`
      },
      {
        stage: "Bank Account Setup",
        duration: setupTimeframe.bankAccountSetup || "7-14 days",
        description: "Opening of corporate bank account"
      }
    ];
    
    // Calculate total timeline
    const estimatedTotal = calculateTotalTimeframe(timelineStages, userData);
    
    return {
      heading: "Implementation Timeline",
      timelineStages,
      estimatedTotal,
      expediteOptions: setupTimeframe.expediteOptions || []
    };
  } catch (error) {
    console.error("Error in generateTimeline:", error);
    return generateDefaultTimeline(userData);
  }
}

// Generate default timeline when an error occurs
function generateDefaultTimeline(userData) {
  const visaCount = userData?.visaCount || 1;
  const timelineStages = [
    {
      stage: "Application Submission",
      duration: "1-2 days",
      description: "Submission of all required documents and forms"
    },
    {
      stage: "Initial Approval",
      duration: "3-5 days",
      description: "Review and initial approval of business application"
    },
    {
      stage: "License Issuance",
      duration: "2-3 days",
      description: "Issuance of business license after approval"
    },
    {
      stage: "Visa Processing",
      duration: "5-7 days per person",
      description: `Processing of ${visaCount} employment visa${visaCount !== 1 ? 's' : ''}`
    },
    {
      stage: "Bank Account Setup",
      duration: "7-14 days",
      description: "Opening of corporate bank account"
    }
  ];
  
  return {
    heading: "Estimated Implementation Timeline",
    timelineStages,
    estimatedTotal: "3-4 weeks",
    expediteOptions: ["Express processing available for key stages"],
    disclaimer: "This is an estimated timeline. Actual timeframes may vary based on authority processing times."
  };
}

// Helper function to calculate total timeframe
function calculateTotalTimeframe(stages, userData) {
  try {
    // This would contain logic to estimate the total setup time
    // based on the stages and specific user requirements
    
    // Simplified example:
    let minDays = 0;
    let maxDays = 0;
    
    stages.forEach(stage => {
      const durationParts = stage.duration.match(/(\d+)-?(\d+)?/);
      if (durationParts) {
        minDays += parseInt(durationParts[1]);
        maxDays += parseInt(durationParts[2] || durationParts[1]);
      }
    });
    
    // Add complexity factors based on user requirements
    if (userData && userData.visaCount > 3) {
      minDays += 3;
      maxDays += 7;
    }
    
    if (userData && userData.needsPhysicalOffice) {
      minDays += 5;
      maxDays += 10;
    }
    
    return `${minDays}-${maxDays} business days`;
  } catch (error) {
    console.error("Error calculating timeframe:", error);
    return "3-4 weeks (estimated)";
  }
}

// Generate next steps section
function generateNextSteps(userData, topMatch) {
  try {
    const freezoneName = topMatch && topMatch.freezoneName ? topMatch.freezoneName : 'your chosen freezone';
    
    return {
      heading: "Next Steps",
      steps: [
        {
          step: "Schedule Consultation",
          description: `Book a 30-minute consultation to discuss your ${freezoneName} business setup in detail`
        },
        {
          step: "Document Collection",
          description: "Prepare necessary documentation for business registration"
        },
        {
          step: "Application Submission",
          description: `Submit application to ${freezoneName} authority`
        },
        {
          step: "Payment Processing",
          description: "Process initial fees to begin incorporation"
        }
      ],
      contactInformation: {
        consultantName: "Zola Business Consultants",
        email: "support@zola.ae",
        phone: "+971-X-XXX-XXXX"
      }
    };
  } catch (error) {
    console.error("Error in generateNextSteps:", error);
    return {
      heading: "Next Steps",
      steps: [
        {
          step: "Schedule Consultation",
          description: "Book a 30-minute consultation to discuss the proposal in detail"
        },
        {
          step: "Document Collection",
          description: "Prepare necessary documentation for business registration"
        },
        {
          step: "Application Submission",
          description: "Submit application to chosen freezone authority"
        },
        {
          step: "Payment Processing",
          description: "Process initial fees to begin incorporation"
        }
      ],
      contactInformation: {
        consultantName: "Zola Business Consultants",
        email: "support@zola.ae",
        phone: "+971-X-XXX-XXXX"
      }
    };
  }
}

// Export functions
module.exports = {
  generateProposal,
  generateIntroduction,
  generatePrimaryRecommendation,
  generateAlternativeOptions,
  generateCostBreakdown,
  generateTimeline,
  generateNextSteps,
  generateFAQSection
};