// Script to create a Pinecone index for the application
require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

async function createPineconeIndex() {
  try {
    console.log('Initializing Pinecone client...');
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENV
    });
    
    const indexName = process.env.PINECONE_INDEX;
    console.log(`Preparing to create index: ${indexName}`);
    
    // Check if index already exists
    const existingIndexes = await pinecone.listIndexes();
    console.log('Existing indexes:', existingIndexes);
    
    if (existingIndexes.some(idx => idx.name === indexName)) {
      console.log(`Index "${indexName}" already exists`);
      return;
    }
    
    // Create the index with serverless configuration
    console.log('Creating serverless index...');
    await pinecone.createIndex({
      name: indexName,
      dimension: 3072, // Using OpenAI's text-embedding-3-large model dimension
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    
    console.log(`Index "${indexName}" created successfully!`);
    console.log('NOTE: It may take a few minutes for the index to become ready');
    
    // Check index status
    console.log('Checking index status...');
    let isReady = false;
    let attempts = 0;
    
    while (!isReady && attempts < 10) {
      attempts++;
      try {
        const indexDescription = await pinecone.describeIndex(indexName);
        console.log('Index status:', indexDescription.status);
        
        if (indexDescription.status?.ready) {
          isReady = true;
          console.log('Index is ready to use!');
        } else {
          console.log(`Waiting for index to become ready (attempt ${attempts}/10)...`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        }
      } catch (error) {
        console.log(`Error checking index status: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      }
    }
    
    if (!isReady) {
      console.log('Index may still be initializing. Please check the Pinecone console.');
    }
    
  } catch (error) {
    console.error('Error creating Pinecone index:', error);
    
    if (error.message?.includes('exceeds the limit')) {
      console.log('\nERROR: You have reached the index limit for your Pinecone tier.');
      console.log('Consider upgrading your plan or deleting unused indexes.');
    } else if (error.message?.includes('not authorized')) {
      console.log('\nERROR: Your API key does not have permission to create indexes.');
      console.log('Please check your API key permissions in the Pinecone console.');
    } else if (error.message?.includes('validation errors')) {
      console.log('\nERROR: Index creation parameters are incorrect.');
      console.log('Some possible errors:');
      console.log('1. The index name must be lowercase, alphanumeric, and start with a letter');
      console.log('2. Free tier requires us-east-1 AWS region');
      console.log('3. You may need to create the index manually in the Pinecone console');
    } else {
      console.log('\nPlease check the error message above for details.');
      console.log('For manual index creation, please:');
      console.log('1. Go to https://app.pinecone.io');
      console.log('2. Create a new index with these settings:');
      console.log('   - Index name: openaiembedding');
      console.log('   - Dimensions: 3072');
      console.log('   - Metric: cosine');
      console.log('   - Cloud: AWS');
      console.log('   - Region: us-east-1');
    }
  }
}

createPineconeIndex(); 