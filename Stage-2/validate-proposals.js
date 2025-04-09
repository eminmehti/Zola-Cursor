// validate-proposals.js
// A utility script to test and validate AI-generated proposals

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');

// Require our retrieval and proposal generator services
const retrievalService = require('./retrieval-service');
const proposalGenerator = require('./proposal-generator');

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'openaiembedding';
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENV || 'us-east-1';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Initialize Pinecone client
let pinecone;
try {
  pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY
  });
} catch (error) {
  console.error('Error initializing Pinecone client:', error);
  process.exit(1);
}

/**
 * Validate proposal generation with different test cases
 */
async function validateProposals() {
  try {
    console.log('Starting validation of proposal generation...');
    
    // Load test cases
    const testCases = await loadTestCases();
    console.log(`Loaded ${testCases.length} test cases`);
    
    // Test results container
    const results = [];
    
    // Process each test case
    for (const [index, testCase] of testCases.entries()) {
      console.log(`\nProcessing test case ${index + 1}/${testCases.length}: ${testCase.name}`);
      
      try {
        // 1. Get freezone suggestions using the retrieval service
        console.log('Retrieving freezone suggestions...');
        const freezoneSuggestions = await retrievalService.getOptimalFreezoneSuggestions(testCase.userData);
        
        // 2. Generate proposal based on suggestions
        console.log('Generating proposal...');
        const proposal = await proposalGenerator.generateProposal(testCase.userData, freezoneSuggestions);
        
        // 3. Evaluate the proposal accuracy
        console.log('Evaluating proposal accuracy...');
        const accuracy = await evaluateProposalAccuracy(proposal, testCase);
        
        // Save result
        results.push({
          testCase: testCase.name,
          topRecommendation: freezoneSuggestions[0]?.freezoneName || 'None',
          accuracyScore: accuracy.score,
          feedback: accuracy.feedback,
          proposal: proposal
        });
        
        console.log(`Test case ${index + 1} completed. Accuracy score: ${accuracy.score}/10`);
      } catch (error) {
        console.error(`Error processing test case ${index + 1}:`, error);
        results.push({
          testCase: testCase.name,
          error: error.message,
          accuracyScore: 0
        });
      }
    }
    
    // Generate summary report
    await generateValidationReport(results);
    
    console.log('\nValidation completed. Report saved to validation-report.json');
  } catch (error) {
    console.error('Error in validation process:', error);
  }
}

/**
 * Load test cases from test-cases.json
 */
async function loadTestCases() {
  try {
    // Check if test cases file exists, if not create sample test cases
    const testCasesPath = path.join(__dirname, 'test-cases.json');
    
    try {
      await fs.access(testCasesPath);
    } catch (error) {
      // File doesn't exist, create sample test cases
      await createSampleTestCases(testCasesPath);
    }
    
    // Read and parse test cases
    const testCasesData = await fs.readFile(testCasesPath, 'utf8');
    return JSON.parse(testCasesData);
  } catch (error) {
    console.error('Error loading test cases:', error);
    return [];
  }
}

/**
 * Create sample test cases if none exist
 */
async function createSampleTestCases(filePath) {
  const sampleTestCases = [
    {
      name: "Tech Startup with 3 Visas",
      userData: {
        companyName: "TechNova Solutions",
        industry: "Technology",
        businessActivities: ["Software Development", "IT Consulting", "Digital Marketing"],
        primaryActivities: ["Software Development"],
        visaCount: 3,
        budget: 25000,
        idealBudget: 20000,
        maxBudget: 30000,
        preferredLocation: "Dubai",
        needsPhysicalOffice: false,
        businessGoals: "establishing a tech startup focused on AI solutions",
        timeline: "Soon (1-2 weeks)"
      },
      expectedFreezoneSuggestions: ["Dubai Internet City", "IFZA", "DMCC"],
      accuracy: {
        costAccuracy: "Budget should be within 20,000-30,000 AED",
        visaAccuracy: "Must support 3 visas minimum",
        activityAccuracy: "Must support tech-related activities"
      }
    },
    {
      name: "Trading Company with 5 Visas",
      userData: {
        companyName: "Global Trade Links",
        industry: "Trading",
        businessActivities: ["General Trading", "Import/Export", "Commercial Brokerage"],
        primaryActivities: ["General Trading", "Import/Export"],
        visaCount: 5,
        budget: 35000,
        idealBudget: 30000,
        maxBudget: 40000,
        preferredLocation: "JAFZA",
        needsPhysicalOffice: true,
        businessGoals: "establishing an import/export business with MENA region",
        timeline: "Standard (2-4 weeks)"
      },
      expectedFreezoneSuggestions: ["JAFZA", "RAKEZ", "DAFZA"],
      accuracy: {
        costAccuracy: "Budget should be within 30,000-40,000 AED",
        visaAccuracy: "Must support 5 visas minimum",
        activityAccuracy: "Must support trading activities"
      }
    },
    {
      name: "Consulting Firm with 2 Visas",
      userData: {
        companyName: "Insight Consulting Group",
        industry: "Consulting",
        businessActivities: ["Business Consulting", "Management Consulting", "Financial Advisory"],
        primaryActivities: ["Business Consulting"],
        visaCount: 2,
        budget: 20000,
        idealBudget: 18000,
        maxBudget: 25000,
        preferredLocation: "Any",
        needsPhysicalOffice: false,
        businessGoals: "starting a boutique consulting firm with focus on SMEs",
        timeline: "Flexible (1-3 months)"
      },
      expectedFreezoneSuggestions: ["Shams", "IFZA", "Meydan"],
      accuracy: {
        costAccuracy: "Budget should be within 18,000-25,000 AED",
        visaAccuracy: "Must support 2 visas minimum",
        activityAccuracy: "Must support consulting activities"
      }
    }
  ];
  
  await fs.writeFile(filePath, JSON.stringify(sampleTestCases, null, 2), 'utf8');
  console.log('Created sample test cases file');
}

/**
 * Evaluate the accuracy of a proposal against expected outcomes
 */
async function evaluateProposalAccuracy(proposal, testCase) {
  try {
    // Use OpenAI to evaluate the proposal against the test case
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert evaluator of business setup proposals for UAE freezones. 
          Your task is to evaluate the accuracy and quality of an AI-generated proposal based on user requirements. 
          Score on a scale of 1-10 and provide specific feedback on areas of improvement.`
        },
        {
          role: "user",
          content: `
            USER REQUIREMENTS:
            ${JSON.stringify(testCase.userData, null, 2)}
            
            EXPECTED OUTCOMES:
            - Expected freezones: ${testCase.expectedFreezoneSuggestions.join(', ')}
            - Cost accuracy: ${testCase.accuracy.costAccuracy}
            - Visa accuracy: ${testCase.accuracy.visaAccuracy}
            - Activity accuracy: ${testCase.accuracy.activityAccuracy}
            
            AI-GENERATED PROPOSAL:
            ${JSON.stringify(proposal, null, 2)}
            
            Please evaluate this proposal on:
            1. Recommendation accuracy (are the recommended freezones appropriate?)
            2. Cost accuracy (do the costs match user's budget constraints?)
            3. Visa alignment (does it properly address visa requirements?)
            4. Activity support (does it address all business activities?)
            5. Personalization (how well is it tailored to this specific user?)
            
            Provide a score from 1-10 and specific feedback on strengths and areas for improvement.
          `
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const evaluation = response.choices[0].message.content;
    
    // Extract score using regex
    const scoreMatch = evaluation.match(/score[^0-9]*([0-9]{1,2})/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 5;
    
    return {
      score: Math.min(score, 10), // Cap at 10
      feedback: evaluation
    };
  } catch (error) {
    console.error('Error evaluating proposal:', error);
    return {
      score: 0,
      feedback: `Error evaluating proposal: ${error.message}`
    };
  }
}

/**
 * Generate a validation report from test results
 */
async function generateValidationReport(results) {
  try {
    // Calculate average accuracy
    const validResults = results.filter(r => !r.error);
    const averageAccuracy = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.accuracyScore, 0) / validResults.length
      : 0;
    
    // Generate report
    const report = {
      generatedAt: new Date().toISOString(),
      averageAccuracyScore: averageAccuracy,
      totalTestCases: results.length,
      successfulTestCases: validResults.length,
      failedTestCases: results.length - validResults.length,
      testResults: results.map(r => ({
        testCase: r.testCase,
        topRecommendation: r.topRecommendation,
        accuracyScore: r.accuracyScore,
        feedback: r.feedback,
        error: r.error || null
      }))
    };
    
    // Save report to file
    await fs.writeFile(
      path.join(__dirname, 'validation-report.json'),
      JSON.stringify(report, null, 2),
      'utf8'
    );
    
    return report;
  } catch (error) {
    console.error('Error generating validation report:', error);
  }
}

// Export validation function
module.exports = { validateProposals };

// Run validation if script is executed directly
if (require.main === module) {
  validateProposals()
    .then(() => console.log('Validation complete'))
    .catch(error => console.error('Validation failed:', error));
} 