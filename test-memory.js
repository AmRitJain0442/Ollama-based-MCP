// test-memory.js
// Simple test to demonstrate the memory functionality

const axios = require('axios');

// Simple test of the MCP server without Ollama
async function testMemoryWithSimpleCommands() {
    const MCP_URL = 'http://localhost:6000';
    
    console.log('🧪 Testing MCP Task Scheduler with Memory\n');
    
    try {
        // Test 1: Create a task
        console.log('1. Creating a task...');
        const createResult = await axios.post(`${MCP_URL}/mcp/v1/tools/create_task`, {
            arguments: {
                title: "Team Meeting with John",
                description: "Weekly sync with the development team",
                start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                tags: ["work"]
            }
        });
        console.log('✅ Created:', createResult.data.result.task.title);
        
        // Test 2: List tasks
        console.log('\n2. Listing all tasks...');
        const listResult = await axios.post(`${MCP_URL}/mcp/v1/tools/list_tasks`, {
            arguments: {}
        });
        console.log('✅ Found tasks:', listResult.data.result.tasks.length);
        listResult.data.result.tasks.forEach(task => {
            console.log(`   - ${task.title} (${new Date(task.start).toLocaleDateString()})`);
        });
        
        // Test 3: Search tasks
        console.log('\n3. Searching for "meeting" tasks...');
        const searchResult = await axios.post(`${MCP_URL}/mcp/v1/tools/search_tasks`, {
            arguments: {
                query: "meeting"
            }
        });
        console.log('✅ Found matching tasks:', searchResult.data.result.tasks.length);
        
        // Test 4: Create another task
        console.log('\n4. Creating another task...');
        const createResult2 = await axios.post(`${MCP_URL}/mcp/v1/tools/create_task`, {
            arguments: {
                title: "Dentist Appointment",
                description: "Regular checkup",
                start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
                tags: ["health"]
            }
        });
        console.log('✅ Created:', createResult2.data.result.task.title);
        
        console.log('\n🎉 Memory Demo Complete!');
        console.log('\nNow you can test the enhanced client with commands like:');
        console.log('- "Show me my tasks"');
        console.log('- "Delete that meeting task"');
        console.log('- "What tasks did I create?"');
        console.log('\nThe memory system will remember the context of these tasks!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testMemoryWithSimpleCommands();
