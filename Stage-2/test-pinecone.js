// Simple script to test Pinecone connection
require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

async function testPinecone() {
  try {
    console.log('Testing Pinecone connection with these settings:');
    console.log(`API Key: ${process.env.PINECONE_API_KEY.substring(0, 10)}...`);
    console.log(`Environment: ${process.env.PINECONE_ENV}`);
    console.log(`Index Name: ${process.env.PINECONE_INDEX}`);
    
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENV
    });
    
    console.log('Pinecone client initialized successfully');
    
    // List indexes to test connection
    const indexesList = await pinecone.listIndexes();
    console.log('Available indexes:', indexesList);
    
    // Try to connect to the specific index
    const index = pinecone.index(process.env.PINECONE_INDEX);
    console.log('Successfully connected to index:', process.env.PINECONE_INDEX);
    
    // Try to get index stats
    const stats = await index.describeIndexStats();
    console.log('Index stats:', stats);
    
    console.log('Pinecone connection test successful!');
  } catch (error) {
    console.error('Pinecone connection test failed:', error);
  }
}

testPinecone(); 