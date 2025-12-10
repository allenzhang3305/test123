import { OpenRouter } from "@openrouter/sdk";


const main = async () => {
const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Stream the response to get reasoning tokens in usage
const stream = await openrouter.chat.send({
  model: "amazon/nova-2-lite-v1:free",
  messages: [
    {
      role: "user",
      content: "How many r's are in the word 'strawberry'?"
    }
  ],
  stream: true,
  streamOptions: {
    includeUsage: true
  }
});

let response = "";
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    response += content;
    process.stdout.write(content);
  }
  
  // Usage information comes in the final chunk
  if (chunk.usage) {
    console.log("\nReasoning tokens:", chunk.usage.totalTokens);
  }
}}

main();