// mcp-ollama-client.js
// This client integrates Ollama with our MCP server

const axios = require('axios');
const readline = require('readline');
const today = new Date();

// Configuration
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MCP_SERVER_URL = 'http://localhost:6000';
const MODEL_NAME = 'llama2'; // or 'mistral', 'codellama', etc.

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// MCP Tools information for the prompt
let TOOLS_INFO = '';

// Initialize by fetching available tools
async function initialize() {
    try {
        console.log('Connecting to MCP server...');
        
        // Fetch available tools
        const toolsResponse = await axios.get(`${MCP_SERVER_URL}/mcp/v1/tools`);
        const tools = toolsResponse.data.tools;
        
        // Build tools description for the LLM
        TOOLS_INFO = tools.map(tool => {
            return `- ${tool.name}: ${tool.description}
  Parameters: ${JSON.stringify(tool.inputSchema.properties, null, 2)}`;
        }).join('\n\n');
        
        console.log('Connected! Available tools:');
        tools.forEach(tool => console.log(`  - ${tool.name}`));
        console.log('\nYou can now chat with your task scheduler!');
        console.log('Examples:');
        console.log('  - "Schedule a meeting with John tomorrow at 2pm"');
        console.log('  - "Show me all my tasks"');
        console.log('  - "Delete the task about dentist appointment"');
        console.log('\n');
        
    } catch (error) {
        console.error('Failed to connect to MCP server:', error.message);
        process.exit(1);
    }
}

// Process user message with Ollama
async function processWithOllama(userMessage) {
    const systemPrompt = `You are a helpful task scheduling assistant with access to a task management system.

Available tools:
${TOOLS_INFO}

When the user asks you to do something, analyze their request and respond with a JSON object containing:
1. "action": The tool name to use
2. "parameters": The parameters to pass to the tool
3. "explanation": A brief explanation of what you're doing

For dates and times:
-Today is ${today.toISOString().split('T')[0]}.Use this as reference for any date calculations.
- Convert natural language like "tomorrow at 2pm" to ISO format
- If no time is specified, use 9am as default
- If no end time is specified, add 1 hour to start time

For tags, choose from: work, personal, family, health, other
Infer appropriate tags from context.

IMPORTANT: Respond ONLY with a valid JSON object, no other text.

Examples:
User: "Schedule a team meeting tomorrow at 3pm"
Response: {"action": "create_task", "parameters": {"title": "Team meeting", "start": "2024-12-19T15:00:00", "end": "2024-12-19T16:00:00", "tags": ["work"]}, "explanation": "Creating a work meeting for tomorrow at 3pm"}

User: "Show me my tasks"
Response: {"action": "list_tasks", "parameters": {}, "explanation": "Listing all your tasks"}`;

    const prompt = `${systemPrompt}\n\nUser: ${userMessage}\nResponse:`;

    try {
        console.log('Thinking...');
        
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL_NAME,
            prompt: prompt,
            stream: false,
            temperature: 0.1, // Low temperature for more consistent JSON
            format: "json" // Request JSON format
        });

        const llmResponse = response.data.response;
        console.log('LLM Response:', llmResponse); // Debug
        
        // Parse the JSON response
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(llmResponse);
        } catch (e) {
            // Try to extract JSON from the response if it contains extra text
            const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedResponse = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Could not parse LLM response as JSON');
            }
        }

        return parsedResponse;
    } catch (error) {
        console.error('Ollama error:', error.message);
        throw error;
    }
}

// Execute MCP tool
async function executeMCPTool(action, parameters) {
    try {
        const response = await axios.post(
            `${MCP_SERVER_URL}/mcp/v1/tools/${action}`,
            { arguments: parameters }
        );
        
        return response.data.result;
    } catch (error) {
        console.error('MCP execution error:', error.response?.data || error.message);
        throw error;
    }
}

// Format task for display
function formatTask(task) {
    const start = new Date(task.start);
    const end = new Date(task.end);
    const dateStr = start.toLocaleDateString();
    const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `  📅 ${task.title}
     Date: ${dateStr}
     Time: ${startTime} - ${endTime}
     Tags: ${task.tags.join(', ')}
     ${task.description ? 'Description: ' + task.description : ''}`;
}

// Main chat loop
async function chatLoop() {
    rl.question('You: ', async (input) => {
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            console.log('Goodbye!');
            rl.close();
            return;
        }

        try {
            // Get LLM's interpretation
            const llmResult = await processWithOllama(input);
            
            if (llmResult.explanation) {
                console.log(`\nAssistant: ${llmResult.explanation}`);
            }

            // Execute the tool
            const result = await executeMCPTool(llmResult.action, llmResult.parameters);
            
            // Display results
            if (result.success) {
                if (llmResult.action === 'list_tasks' && result.tasks) {
                    if (result.tasks.length === 0) {
                        console.log('\nNo tasks found.');
                    } else {
                        console.log(`\nFound ${result.tasks.length} task(s):`);
                        result.tasks.forEach(task => {
                            console.log(formatTask(task));
                        });
                    }
                } else if (result.message) {
                    console.log(`\n✅ ${result.message}`);
                } else {
                    console.log('\n✅ Action completed successfully!');
                }
            } else {
                console.log(`\n❌ Error: ${result.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('\n❌ Error:', error.message);
            console.log('Please try rephrasing your request.');
        }

        console.log('\n' + '-'.repeat(50) + '\n');
        chatLoop(); // Continue the conversation
    });
}

// Simple CLI without Ollama (for testing)
async function simpleCLI() {
    console.log('\nSimple CLI Mode (no LLM)');
    console.log('Commands:');
    console.log('  create <title> - Create a task');
    console.log('  list - List all tasks');
    console.log('  exit - Quit\n');

    rl.question('Command: ', async (input) => {
        const [command, ...args] = input.split(' ');

        try {
            switch (command) {
                case 'create':
                    const title = args.join(' ');
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(9, 0, 0, 0);
                    
                    const result = await executeMCPTool('create_task', {
                        title: title,
                        start: tomorrow.toISOString(),
                        tags: ['other']
                    });
                    console.log('Task created:', result);
                    break;

                case 'list':
                    const listResult = await executeMCPTool('list_tasks', {});
                    if (listResult.tasks.length === 0) {
                        console.log('No tasks found.');
                    } else {
                        listResult.tasks.forEach(task => {
                            console.log(formatTask(task));
                        });
                    }
                    break;

                case 'exit':
                    rl.close();
                    return;

                default:
                    console.log('Unknown command');
            }
        } catch (error) {
            console.error('Error:', error.message);
        }

        simpleCLI();
    });
}

// Main function
async function main() {
    await initialize();
    
    // Check if Ollama is available
    try {
        await axios.get('http://localhost:11434/api/tags');
        console.log('Ollama detected! Starting AI chat mode...\n');
        chatLoop();
    } catch (error) {
        console.log('Ollama not detected. Starting simple CLI mode...');
        simpleCLI();
    }
}

// Start the client
main().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    rl.close();
    process.exit(0);
});