// Load environment variables from .env file
require('dotenv').config();

// Debug: print out the loaded API key and extra info (remove these lines when finished debugging)
console.log("DEBUG: Loaded API Key is:", process.env.OPENAI_API_KEY);
console.log("DEBUG: Loaded Organization is:", process.env.OPENAI_ORGANIZATION);
console.log("DEBUG: Loaded Project is:", process.env.OPENAI_PROJECT);

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory (for the frontend)
app.use(express.static('public'));

// This variable tracks the number of chatbot exchanges
let conversationCount = 0;

// POST endpoint to handle chat messages
app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    conversationCount++;

    // Call OpenAI API with a system prompt that limits topics.
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini-2024-07-18",
        messages: [
          {
            role: "system",
            content: "You are an AI chatbot specialized in business in Dubai and Zola Group services. If a user asks a question unrelated to these topics, explain that your responses are limited to business in Dubai and ZolaGroup services. Answer questions in a professional tone, helping the user understand business formation in the UAE and how Zola can help them with their setup. After a few questions, start prompting the user to fill out the form thats available on the website for us to generate an offer for them, and to start the process of setting their business, visa etc up."
          },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Organization': process.env.OPENAI_ORGANIZATION,
          'OpenAI-Project': process.env.OPENAI_PROJECT
        }
      }
    );

    // Debug: log the full OpenAI response
    console.log("DEBUG: OpenAI API Response:", JSON.stringify(openaiResponse.data, null, 2));

    // Check if the response includes a valid message
    const choice = openaiResponse.data.choices && openaiResponse.data.choices[0];
    if (!choice) {
      throw new Error("No choices returned from OpenAI API.");
    }
    const messageObj = choice.message;
    if (!messageObj || typeof messageObj.content !== "string") {
      throw new Error("No message content found in response: " + JSON.stringify(openaiResponse.data));
    }
    let reply = messageObj.content;

    if (conversationCount % 2 === 0) {
      reply += "\n\nIf you'd like to learn more or proceed to the next step, please visit our Stage 2 questionnaire here: [Insert Link]";
    }

    res.json({ reply });
  } catch (error) {
    console.error("Error communicating with OpenAI:");
    if (error.response) {
      console.error("Status Code:", error.response.status);
      console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error Message:", error.message);
    }
    res.status(500).json({ error: "An error occurred while processing your message." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

