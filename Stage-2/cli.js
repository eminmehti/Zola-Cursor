#!/usr/bin/env node
// cli.js - Command line interface for managing freezones data and AI proposals

require('dotenv').config();
const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs').promises;
const path = require('path');

// Import our utility modules
const dataPreprocessor = require('./data-preprocessor');
const { validateProposals } = require('./validate-proposals');

// Setup commander
const program = new Command();
program
  .name('zola-cli')
  .description('CLI for managing Zola\'s freezones data and AI proposals')
  .version('1.0.0');

// Command to preprocess and upload data to Pinecone
program
  .command('upload-data')
  .description('Preprocess and upload freezones data to Pinecone')
  .option('-f, --file <filepath>', 'Path to CSV file (default: freezonedata.csv)')
  .action(async (options) => {
    try {
      const spinner = ora('Processing freezones data...').start();
      
      const filePath = options.file || path.join(__dirname, 'freezonedata.csv');
      
      spinner.text = 'Checking if file exists...';
      try {
        await fs.access(filePath);
      } catch (error) {
        spinner.fail(`File not found: ${filePath}`);
        return;
      }
      
      spinner.text = 'Preprocessing and uploading data to Pinecone...';
      const success = await dataPreprocessor.processAndUpsertFreezoneData(filePath);
      
      if (success) {
        spinner.succeed('Successfully uploaded freezone data to Pinecone');
      } else {
        spinner.fail('Failed to upload data to Pinecone');
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Command to validate proposal generation
program
  .command('validate')
  .description('Validate AI proposal generation with test cases')
  .option('-t, --test-file <filepath>', 'Path to test cases file (default: test-cases.json)')
  .action(async (options) => {
    try {
      const spinner = ora('Validating AI proposal generation...').start();
      
      // Run validation
      await validateProposals();
      
      spinner.succeed('Validation completed. Report saved to validation-report.json');
      
      // Display summary if validation report exists
      try {
        const reportPath = path.join(__dirname, 'validation-report.json');
        const reportData = await fs.readFile(reportPath, 'utf8');
        const report = JSON.parse(reportData);
        
        console.log('\nValidation Summary:');
        console.log(`Average accuracy score: ${chalk.green(report.averageAccuracyScore.toFixed(2))} / 10`);
        console.log(`Successful test cases: ${chalk.green(report.successfulTestCases)} / ${report.totalTestCases}`);
        
        if (report.failedTestCases > 0) {
          console.log(`Failed test cases: ${chalk.red(report.failedTestCases)}`);
        }
      } catch (error) {
        console.log('Could not read validation report for summary.');
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Command to create a sample test case
program
  .command('create-test')
  .description('Create a new test case for validation')
  .action(async () => {
    try {
      // Get test case details through interactive prompts
      const testCase = await promptForTestCase();
      
      // Save to test cases file
      const testCasesPath = path.join(__dirname, 'test-cases.json');
      
      // Read existing test cases or create empty array
      let testCases = [];
      try {
        const existingData = await fs.readFile(testCasesPath, 'utf8');
        testCases = JSON.parse(existingData);
      } catch (error) {
        // File doesn't exist or invalid JSON, use empty array
      }
      
      // Add new test case
      testCases.push(testCase);
      
      // Save updated test cases
      await fs.writeFile(testCasesPath, JSON.stringify(testCases, null, 2), 'utf8');
      
      console.log(chalk.green('Test case created and saved to test-cases.json'));
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Add after other CLI commands
program
  .command('test-cost-breakdown')
  .description('Test the cost breakdown generation with sample data')
  .action(async () => {
    try {
      const { generateCostBreakdown } = require('./proposal-generator');
      
      // Sample user data
      const userData = {
        companyName: "Test Company",
        industry: "Technology", 
        businessActivities: ["Software Development", "IT Consulting"],
        visaCount: 3,
        budget: 30000,
        needsPhysicalOffice: true
      };
      
      // Sample recommendation that would come from Pinecone
      const sampleRecommendation = {
        freezoneName: "Dubai Multi Commodities Centre",
        details: {
          costStructure: {
            setupCost: 32500,
            renewalCost: 22000,
            licenseFee: 15000,
            registrationFee: 5500,
            visaCost: 3500,
            officeCost: 8500,
            physicalOfficeCost: 12000
          },
          visaInfo: {
            initialAllocation: 2,
            maxAllocation: 5
          }
        }
      };
      
      // Generate cost breakdown
      console.log('Generating cost breakdown for test data...');
      const costBreakdown = generateCostBreakdown(userData, sampleRecommendation);
      
      // Display the result
      console.log('\nCost Breakdown Result:');
      console.log(JSON.stringify(costBreakdown, null, 2));
      
      console.log('\nTest completed successfully!');
    } catch (error) {
      console.error('Error testing cost breakdown:', error);
    }
  });

/**
 * Interactive prompt to create a test case
 */
async function promptForTestCase() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Test case name:',
      validate: input => input ? true : 'Name is required'
    },
    {
      type: 'input',
      name: 'companyName',
      message: 'Company name:',
      default: 'Sample Company'
    },
    {
      type: 'input',
      name: 'industry',
      message: 'Industry:',
      default: 'Technology'
    },
    {
      type: 'input',
      name: 'businessActivities',
      message: 'Business activities (comma separated):',
      default: 'Software Development, IT Consulting',
      filter: input => input.split(',').map(act => act.trim())
    },
    {
      type: 'input',
      name: 'primaryActivities',
      message: 'Primary activities (comma separated):',
      default: 'Software Development',
      filter: input => input.split(',').map(act => act.trim())
    },
    {
      type: 'number',
      name: 'visaCount',
      message: 'Visa count:',
      default: 3
    },
    {
      type: 'number',
      name: 'budget',
      message: 'Budget (AED):',
      default: 25000
    },
    {
      type: 'input',
      name: 'preferredLocation',
      message: 'Preferred location:',
      default: 'Dubai'
    },
    {
      type: 'confirm',
      name: 'needsPhysicalOffice',
      message: 'Needs physical office?',
      default: false
    },
    {
      type: 'input',
      name: 'businessGoals',
      message: 'Business goals:',
      default: 'establishing a business in the UAE'
    },
    {
      type: 'list',
      name: 'timeline',
      message: 'Timeline:',
      choices: [
        'Urgent (< 1 week)',
        'Soon (1-2 weeks)',
        'Standard (2-4 weeks)',
        'Flexible (1-3 months)'
      ],
      default: 'Standard (2-4 weeks)'
    },
    {
      type: 'input',
      name: 'expectedFreezoneSuggestions',
      message: 'Expected freezone suggestions (comma separated):',
      default: 'IFZA, DMCC, Shams',
      filter: input => input.split(',').map(zone => zone.trim())
    },
    {
      type: 'input',
      name: 'costAccuracy',
      message: 'Cost accuracy expectation:',
      default: 'Budget should be within 20,000-30,000 AED'
    },
    {
      type: 'input',
      name: 'visaAccuracy',
      message: 'Visa accuracy expectation:',
      default: 'Must support specified number of visas'
    },
    {
      type: 'input',
      name: 'activityAccuracy',
      message: 'Activity accuracy expectation:',
      default: 'Must support all specified business activities'
    }
  ]);
  
  // Format into test case structure
  return {
    name: answers.name,
    userData: {
      companyName: answers.companyName,
      industry: answers.industry,
      businessActivities: answers.businessActivities,
      primaryActivities: answers.primaryActivities,
      visaCount: answers.visaCount,
      budget: answers.budget,
      idealBudget: Math.round(answers.budget * 0.9),
      maxBudget: Math.round(answers.budget * 1.2),
      preferredLocation: answers.preferredLocation,
      needsPhysicalOffice: answers.needsPhysicalOffice,
      businessGoals: answers.businessGoals,
      timeline: answers.timeline
    },
    expectedFreezoneSuggestions: answers.expectedFreezoneSuggestions,
    accuracy: {
      costAccuracy: answers.costAccuracy,
      visaAccuracy: answers.visaAccuracy,
      activityAccuracy: answers.activityAccuracy
    }
  };
}

// Parse arguments and execute
program.parse(process.argv);

// Display help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 