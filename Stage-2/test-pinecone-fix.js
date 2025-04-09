// Diagnostic script for Pinecone connection
require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

async function diagnosePinecone() {
  try {
    console.log('--- PINECONE CONNECTION DIAGNOSTIC ---');
    console.log('Environment variables:');
    console.log(`PINECONE_ENV: ${process.env.PINECONE_ENV}`);
    console.log(`PINECONE_INDEX: ${process.env.PINECONE_INDEX}`);
    console.log(`API Key prefix: ${process.env.PINECONE_API_KEY.substring(0, 10)}...`);
    
    // Initialize Pinecone with correct parameters
    console.log('\nInitializing Pinecone client...');
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENV
    });
    console.log('Pinecone client initialized successfully');
    
    // List available indexes
    console.log('\nListing available indexes...');
    const indexes = await pinecone.listIndexes();
    console.log('Available indexes:', indexes);
    
    if (indexes.length === 0) {
      console.log('\n⚠️ No indexes found in your Pinecone account.');
      console.log('Do you want to create an index? Run the create-pinecone-index.js script.');
      return;
    }
    
    // Check if our configured index exists
    const configuredIndexExists = indexes.some(index => 
      index.name === process.env.PINECONE_INDEX || 
      index.name.startsWith(`${process.env.PINECONE_INDEX}-`)
    );
    
    if (!configuredIndexExists) {
      console.log(`\n⚠️ Index "${process.env.PINECONE_INDEX}" not found among available indexes.`);
      console.log('Available indexes are:', indexes.map(i => i.name).join(', '));
      console.log('\nPlease update your PINECONE_INDEX in .env to one of these values or create a new index.');
      return;
    }
    
    // Try connecting to the first available index to test API key
    const firstIndex = indexes[0];
    console.log(`\nAttempting to connect to index: ${firstIndex.name}...`);
    const testIndex = pinecone.index(firstIndex.name);
    
    const stats = await testIndex.describeIndexStats();
    console.log('Successfully connected to index!');
    console.log('Index stats:', stats);
    
    console.log('\n✅ API key is valid and can access indexes.');
    
    // Now try our configured index
    if (process.env.PINECONE_INDEX !== firstIndex.name) {
      console.log(`\nNow testing configured index: ${process.env.PINECONE_INDEX}...`);
      try {
        const configuredIndex = pinecone.index(process.env.PINECONE_INDEX);
        const configStats = await configuredIndex.describeIndexStats();
        console.log('Successfully connected to configured index!');
        console.log('Index stats:', configStats);
      } catch (error) {
        console.log(`\n⚠️ Cannot connect to configured index "${process.env.PINECONE_INDEX}"`);
        console.log('Error:', error.message);
        console.log('Try updating your PINECONE_INDEX in .env to exactly match one from the list above.');
      }
    }
    
    console.log('\n--- DIAGNOSTIC COMPLETE ---');
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    console.log('\nPossible solutions:');
    console.log('1. Check if your API key is valid and has not expired');
    console.log('2. Ensure your Pinecone account is active and not suspended');
    console.log('3. Verify that your account has permission to access the requested index');
    console.log('4. Make sure your environment setting is correct (try "us-east-1-aws" or check Pinecone console)');
  }
}

diagnosePinecone(); 