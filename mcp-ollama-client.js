// mcp-ollama-client.js
// This client integrates Ollama with our MCP server and simple memory management

const axios = require('axios');
const readline = require('readline');
const today = new Date();

// Simple Memory Management
class ConversationMemory {
    constructor(maxMessages = 20) {
        this.messages = [];
        this.maxMessages = maxMessages;
        this.summary = '';
    }

    addMessage(role, content) {
        this.messages.push({
            role: role, // 'user' or 'assistant'
            content: content,
            timestamp: new Date().toISOString()
        });

        // Keep only recent messages to avoid context overflow
        if (this.messages.length > this.maxMessages) {
            // Summarize old messages before removing them
            const oldMessages = this.messages.splice(0, this.messages.length - this.maxMessages);
            this.updateSummary(oldMessages);
        }
    }

    updateSummary(oldMessages) {
        if (oldMessages.length > 0) {
            const taskActions = oldMessages.filter(msg => 
                msg.content.includes('created') || 
                msg.content.includes('scheduled') || 
                msg.content.includes('deleted') || 
                msg.content.includes('updated')
            );
            
            if (taskActions.length > 0) {
                this.summary += '\nPrevious session: ' + 
                    taskActions.map(msg => msg.content).join('; ') + '.';
            }
        }
    }

    getContextString() {
        let context = '';
        
        if (this.summary) {
            context += `Summary of earlier conversation: ${this.summary}\n\n`;
        }
        
        if (this.messages.length > 0) {
            context += 'Recent conversation:\n';
            this.messages.forEach((msg, index) => {
                context += `${msg.role}: ${msg.content}\n`;
            });
        }
        
        return context;
    }

    clear() {
        this.messages = [];
        this.summary = '';
    }

    getHistory() {
        return {
            messages: this.messages,
            summary: this.summary,
            totalMessages: this.messages.length
        };
    }
}

// Configuration
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MCP_SERVER_URL = 'http://localhost:6000';
const MODEL_NAME = 'llama2'; // or 'mistral', 'codellama', etc.

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Memory Management
const conversationMemory = new ConversationMemory(15); // Keep last 15 messages

// MCP Tools information for the prompt
let TOOLS_INFO = '';

// Initialize by fetching available tools and setting up memory
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
        console.log('\n✨ Smart memory system initialized for conversation history!');
        console.log('\nYou can now chat with your task scheduler!');
        console.log('Examples:');
        console.log('  - "Schedule a meeting with John tomorrow at 2pm"');
        console.log('  - "Show me all my tasks"');
        console.log('  - "What tasks did I create earlier?"');
        console.log('  - "Delete the task about dentist appointment"');
        console.log('\n');
        
    } catch (error) {
        console.error('Failed to connect to MCP server:', error.message);
        process.exit(1);
    }
}

// Process user message with Ollama and memory
async function processWithOllama(userMessage) {
    // Add user message to memory
    conversationMemory.addMessage('user', userMessage);
    
    // Get conversation context
    const conversationContext = conversationMemory.getContextString();
    
    const systemPrompt = `You are a helpful task scheduling assistant with access to a task management system.

Available tools:
${TOOLS_INFO}

CONVERSATION CONTEXT:
${conversationContext}

When the user asks you to do something, analyze their request and respond with a JSON object containing:
1. "action": The tool name to use (or "ask_clarification" if information is missing)
2. "parameters": The parameters to pass to the tool (or empty object if asking for clarification)
3. "explanation": A brief explanation of what you're doing
4. "missing_info": Array of missing information needed (only if action is "ask_clarification")
5. "validation_summary": A clear summary of what will be executed for user confirmation

For dates and times:
- Today is ${today.toISOString().split('T')[0]}. Use this as reference for any date calculations.
- Convert natural language like "tomorrow at 2pm" to ISO format
- If no time is specified, use 9am as default
- If no end time is specified, add 1 hour to start time

For tags, choose from: work, personal, family, health, other
Infer appropriate tags from context.

If the request is vague or missing critical information, use "ask_clarification" action.

Use the conversation history to understand references like "the meeting I mentioned", "that task", etc.

IMPORTANT: Respond ONLY with a valid JSON object, no other text.

Examples:
User: "Schedule a meeting"
Response: {"action": "ask_clarification", "parameters": {}, "explanation": "I need more details to schedule your meeting", "missing_info": ["meeting title/topic", "date and time", "duration or end time"], "validation_summary": ""}

User: "Schedule a team meeting tomorrow at 3pm"
Response: {"action": "create_task", "parameters": {"title": "Team meeting", "start": "2025-07-02T15:00:00", "end": "2025-07-02T16:00:00", "tags": ["work"]}, "explanation": "Creating a work meeting for tomorrow at 3pm", "validation_summary": "Create 'Team meeting' on July 2, 2025 from 3:00 PM to 4:00 PM with work tag"}

User: "Show me my tasks"
Response: {"action": "list_tasks", "parameters": {}, "explanation": "Listing all your tasks", "validation_summary": "Display all your current tasks"}`;

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

// Function to ask for user confirmation
function askForConfirmation(message) {
    return new Promise((resolve) => {
        rl.question(`${message} (y/n): `, (answer) => {
            resolve(answer.toLowerCase().startsWith('y'));
        });
    });
}

// Function to ask for missing information
function askForMissingInfo(prompt) {
    return new Promise((resolve) => {
        rl.question(`${prompt}: `, (answer) => {
            resolve(answer.trim());
        });
    });
}

// Main chat loop with memory
async function chatLoop() {
    rl.question('You: ', async (input) => {
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            console.log('\n📝 Conversation Summary:');
            const history = conversationMemory.getHistory();
            if (history.summary) {
                console.log(history.summary);
            }
            console.log(`Total messages in this session: ${history.totalMessages}`);
            console.log('\nGoodbye!');
            rl.close();
            return;
        }

        // Show memory info command
        if (input.toLowerCase() === 'memory' || input.toLowerCase() === 'history') {
            console.log('\n📚 Conversation History:');
            const history = conversationMemory.getHistory();
            
            if (history.summary) {
                console.log(`Summary: ${history.summary}\n`);
            }
            
            history.messages.forEach((msg, index) => {
                const role = msg.role === 'user' ? 'You' : 'Assistant';
                const time = new Date(msg.timestamp).toLocaleTimeString();
                console.log(`${index + 1}. [${time}] ${role}: ${msg.content}`);
            });
            console.log(`\nTotal messages: ${history.totalMessages}`);
            chatLoop();
            return;
        }

        // Clear memory command
        if (input.toLowerCase() === 'clear memory') {
            conversationMemory.clear();
            console.log('✅ Conversation history cleared!');
            chatLoop();
            return;
        }

        try {
            // Get LLM's interpretation
            const llmResult = await processWithOllama(input);
            
            // Handle clarification requests
            if (llmResult.action === 'ask_clarification') {
                console.log(`\n🤔 ${llmResult.explanation}`);
                
                if (llmResult.missing_info && llmResult.missing_info.length > 0) {
                    console.log('\nI need the following information:');
                    llmResult.missing_info.forEach((info, index) => {
                        console.log(`  ${index + 1}. ${info}`);
                    });
                    
                    console.log('\nPlease provide more details and try again.');
                    conversationMemory.addMessage('assistant', `Asked for clarification: ${llmResult.missing_info.join(', ')}`);
                }
                
                console.log('\n' + '-'.repeat(50));
                chatLoop();
                return;
            }
            
            // Show what the assistant plans to do
            if (llmResult.explanation) {
                console.log(`\n🤖 Assistant: ${llmResult.explanation}`);
            }
            
            // Show validation summary and ask for confirmation
            if (llmResult.validation_summary) {
                console.log(`\n📋 Action Summary: ${llmResult.validation_summary}`);
                
                const confirmed = await askForConfirmation('\n❓ Do you want me to proceed with this action?');
                
                if (!confirmed) {
                    console.log('❌ Action cancelled.');
                    conversationMemory.addMessage('assistant', 'Action was cancelled by user');
                    console.log('\n' + '-'.repeat(50));
                    chatLoop();
                    return;
                }
            }

            // Execute the tool
            console.log('\n⏳ Executing...');
            const result = await executeMCPTool(llmResult.action, llmResult.parameters);
            
            // Prepare assistant response for memory
            let assistantResponse = llmResult.explanation || 'Action completed';
            
            // Display results
            if (result.success) {
                if (llmResult.action === 'list_tasks' && result.tasks) {
                    if (result.tasks.length === 0) {
                        console.log('\n📭 No tasks found.');
                        assistantResponse += '. No tasks found.';
                    } else {
                        console.log(`\n📋 Found ${result.tasks.length} task(s):`);
                        result.tasks.forEach(task => {
                            console.log(formatTask(task));
                        });
                        assistantResponse += `. Found ${result.tasks.length} tasks: ${result.tasks.map(t => t.title).join(', ')}.`;
                    }
                } else if (result.message) {
                    console.log(`\n✅ ${result.message}`);
                    assistantResponse += `. ${result.message}`;
                } else if (result.task) {
                    // For created tasks, add task details to memory
                    console.log('\n✅ Task created successfully!');
                    console.log(formatTask(result.task));
                    assistantResponse += `. Successfully created task: "${result.task.title}" scheduled for ${new Date(result.task.start).toLocaleDateString()} at ${new Date(result.task.start).toLocaleTimeString()}.`;
                } else {
                    console.log('\n✅ Action completed successfully!');
                    assistantResponse += '. Action completed successfully.';
                }
            } else {
                console.log(`\n❌ Error: ${result.error || 'Unknown error'}`);
                assistantResponse += `. Error: ${result.error || 'Unknown error'}`;
            }
            
            // Add assistant response to memory
            conversationMemory.addMessage('assistant', assistantResponse);
            
        } catch (error) {
            console.error('\n❌ Error:', error.message);
            console.log('Please try rephrasing your request.');
            
            // Still add to memory for context
            conversationMemory.addMessage('assistant', `Error occurred: ${error.message}`);
        }

        console.log('\n' + '-'.repeat(50));
        console.log('💡 Tip: Type "memory" to see history, "clear memory" to reset, or "exit" to quit.');
        console.log('-'.repeat(50) + '\n');
        chatLoop(); // Continue the conversation
    });
}

// Simple CLI without Ollama (for testing) - now with validation
async function simpleCLI() {
    console.log('\nSimple CLI Mode (no LLM) - Enhanced with Validation');
    console.log('Commands:');
    console.log('  create <title> - Create a task (with interactive prompts)');
    console.log('  list - List all tasks');
    console.log('  search <query> - Search tasks');
    console.log('  exit - Quit\n');

    rl.question('Command: ', async (input) => {
        const [command, ...args] = input.split(' ');

        try {
            switch (command) {
                case 'create':
                    let title = args.join(' ');
                    
                    // Ask for title if not provided
                    if (!title) {
                        title = await askForMissingInfo('📝 Enter task title');
                        if (!title) {
                            console.log('❌ Title is required.');
                            break;
                        }
                    }
                    
                    // Ask for additional details
                    const description = await askForMissingInfo('📄 Enter task description (optional)');
                    const dateInput = await askForMissingInfo('📅 Enter date (e.g., "tomorrow", "July 5", or leave empty for tomorrow)');
                    const timeInput = await askForMissingInfo('⏰ Enter time (e.g., "2pm", "14:30", or leave empty for 9am)');
                    const tagsInput = await askForMissingInfo('🏷️  Enter tags (work,personal,family,health,other - or leave empty for "other")');
                    
                    // Process date
                    let taskDate = new Date();
                    if (dateInput) {
                        if (dateInput.toLowerCase() === 'tomorrow') {
                            taskDate.setDate(taskDate.getDate() + 1);
                        } else {
                            taskDate = new Date(dateInput);
                            if (isNaN(taskDate.getTime())) {
                                taskDate = new Date();
                                taskDate.setDate(taskDate.getDate() + 1);
                                console.log('⚠️  Invalid date format, using tomorrow instead.');
                            }
                        }
                    } else {
                        taskDate.setDate(taskDate.getDate() + 1); // Default to tomorrow
                    }
                    
                    // Process time
                    if (timeInput) {
                        const timeMatch = timeInput.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i);
                        if (timeMatch) {
                            let hours = parseInt(timeMatch[1]);
                            const minutes = parseInt(timeMatch[2] || '0');
                            const ampm = timeMatch[3];
                            
                            if (ampm && ampm.toLowerCase() === 'pm' && hours !== 12) {
                                hours += 12;
                            } else if (ampm && ampm.toLowerCase() === 'am' && hours === 12) {
                                hours = 0;
                            }
                            
                            taskDate.setHours(hours, minutes, 0, 0);
                        }
                    } else {
                        taskDate.setHours(9, 0, 0, 0); // Default to 9am
                    }
                    
                    // Process tags
                    const tags = tagsInput ? 
                        tagsInput.split(',').map(t => t.trim()).filter(t => 
                            ['work', 'personal', 'family', 'health', 'other'].includes(t)
                        ) : ['other'];
                    
                    // Show validation summary
                    console.log('\n📋 Task Summary:');
                    console.log(`   Title: ${title}`);
                    console.log(`   Description: ${description || 'None'}`);
                    console.log(`   Date & Time: ${taskDate.toLocaleDateString()} at ${taskDate.toLocaleTimeString()}`);
                    console.log(`   Tags: ${tags.join(', ')}`);
                    
                    const confirmed = await askForConfirmation('\n❓ Create this task?');
                    
                    if (!confirmed) {
                        console.log('❌ Task creation cancelled.');
                        break;
                    }
                    
                    const result = await executeMCPTool('create_task', {
                        title: title,
                        description: description,
                        start: taskDate.toISOString(),
                        tags: tags
                    });
                    
                    if (result.success) {
                        console.log('✅ Task created:', result.task.title);
                    } else {
                        console.log('❌ Error:', result.error);
                    }
                    break;

                case 'list':
                    const confirmed2 = await askForConfirmation('📋 List all tasks?');
                    if (!confirmed2) {
                        console.log('❌ Action cancelled.');
                        break;
                    }
                    
                    const listResult = await executeMCPTool('list_tasks', {});
                    if (listResult.tasks.length === 0) {
                        console.log('📭 No tasks found.');
                    } else {
                        console.log(`📋 Found ${listResult.tasks.length} tasks:`);
                        listResult.tasks.forEach(task => {
                            console.log(formatTask(task));
                        });
                    }
                    break;

                case 'search':
                    const query = args.join(' ');
                    if (!query) {
                        console.log('❌ Please provide a search query.');
                        break;
                    }
                    
                    const confirmed3 = await askForConfirmation(`🔍 Search for "${query}"?`);
                    if (!confirmed3) {
                        console.log('❌ Search cancelled.');
                        break;
                    }
                    
                    const searchResult = await executeMCPTool('search_tasks', { query });
                    if (searchResult.tasks.length === 0) {
                        console.log(`📭 No tasks found matching "${query}".`);
                    } else {
                        console.log(`🔍 Found ${searchResult.tasks.length} tasks matching "${query}":`);
                        searchResult.tasks.forEach(task => {
                            console.log(formatTask(task));
                        });
                    }
                    break;

                case 'exit':
                    rl.close();
                    return;

                default:
                    console.log('❓ Unknown command. Use: create, list, search, or exit');
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
        }

        console.log('\n' + '-'.repeat(40));
        simpleCLI();
    });
}

// Main function
async function main() {
    console.log('🤖 MCP Task Scheduler with Smart Memory & Validation');
    console.log('===================================================\n');
    
    await initialize();
    
    // Check if Ollama is available
    try {
        await axios.get('http://localhost:11434/api/tags');
        console.log('🚀 Ollama detected! Starting AI chat mode with enhanced features...');
        console.log('💡 Enhanced features:');
        console.log('   • 🧠 Conversation history and context awareness');
        console.log('   • 🤔 Asks for missing information before proceeding');
        console.log('   • ✅ Requires user confirmation before executing actions');
        console.log('   • 🔗 Smart task references ("that meeting", "the task I mentioned")');
        console.log('   • 📝 Automatic memory summarization for long conversations');
        console.log('   • 🎮 Commands: "memory", "clear memory", "exit"\n');
        console.log('🛡️  Safety Features:');
        console.log('   • All actions require your confirmation');
        console.log('   • Missing information prompts for clarity');
        console.log('   • Clear action summaries before execution\n');
        chatLoop();
    } catch (error) {
        console.log('Ollama not detected. Starting enhanced CLI mode with validation...');
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