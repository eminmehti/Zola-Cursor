// Modern approach to connecting to Pinecone (without environment parameter)
require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

async function testPineconeConnection() {
  try {
    console.log('--- TESTING PINECONE CONNECTION (MODERN APPROACH) ---');
    console.log(`API Key prefix: ${process.env.PINECONE_API_KEY.substring(0, 10)}...`);
    
    // Initialize Pinecone with only API key (modern approach)
    console.log('\nInitializing Pinecone client with modern approach...');
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    console.log('Pinecone client initialized successfully');
    
    // List available indexes
    console.log('\nListing available indexes...');
    try {
      const response = await pinecone.listIndexes();
      console.log('Available indexes:', response);
      
      // Extract indexes array from response
      const indexes = response.indexes || [];
      
      if (indexes.length === 0) {
        console.log('\n⚠️ No indexes found in your Pinecone account.');
        console.log('You may need to create an index first.');
      } else {
        // Try to connect to an index
        const firstIndex = indexes[0];
        console.log(`\nAttempting to connect to index: ${firstIndex.name}...`);
        const index = pinecone.index(firstIndex.name);
        
        try {
          const stats = await index.describeIndexStats();
          console.log('Successfully connected to index!');
          console.log('Index stats:', stats);
          console.log('\n✅ Pinecone connection successful!');
          
          // Check if our configured index exists
          const configuredIndexName = process.env.PINECONE_INDEX;
          const configuredIndexExists = indexes.some(idx => idx.name === configuredIndexName);
          
          if (configuredIndexExists) {
            console.log(`\nYour configured index "${configuredIndexName}" exists in your account.`);
            
            // Try connecting to the configured index if it's different from the first index
            if (configuredIndexName !== firstIndex.name) {
              console.log(`\nTesting connection to your configured index: ${configuredIndexName}...`);
              const configuredIndex = pinecone.index(configuredIndexName);
              const configStats = await configuredIndex.describeIndexStats();
              console.log('Successfully connected to your configured index!');
              console.log('Index stats:', configStats);
            }
          } else {
            console.log(`\n⚠️ Your configured index "${configuredIndexName}" does not exist in your account.`);
            console.log('Available indexes:', indexes.map(idx => idx.name).join(', '));
            console.log(`\nPlease either:`);
            console.log(`1. Update your PINECONE_INDEX in .env to one of the available indexes, or`);
            console.log(`2. Create a new index with the name "${configuredIndexName}"`);
          }
        } catch (indexError) {
          console.error('Error connecting to index:', indexError);
        }
      }
    } catch (listError) {
      console.error('Error listing indexes:', listError);
      throw listError;
    }
  } catch (error) {
    console.error('\n❌ PINECONE CONNECTION ERROR:', error);
    
    // Check if package version might be outdated
    try {
      const packageJson = require('@pinecone-database/pinecone/package.json');
      console.log(`\nPinecone SDK version: ${packageJson.version}`);
      console.log('If this version is outdated, try upgrading with:');
      console.log('npm install @pinecone-database/pinecone@latest');
    } catch (e) {
      console.log('Could not determine Pinecone SDK version');
    }
    
    console.log('\nPossible solutions:');
    console.log('1. Check if your API key is valid and not expired');
    console.log('2. Ensure your Pinecone account is active');
    console.log('3. You might need to create a Pinecone index first');
    console.log('4. Try upgrading to the latest Pinecone SDK version');
    console.log('5. Check the Pinecone status page: https://status.pinecone.io');
  }
}

testPineconeConnection(); 