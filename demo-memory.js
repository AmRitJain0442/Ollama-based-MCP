// demo-memory.js
// Demo script to showcase the memory functionality of the enhanced client

const axios = require('axios');
const MCP_SERVER_URL = 'http://localhost:6000';

// Simple Memory Management (same as in main client)
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

        if (this.messages.length > this.maxMessages) {
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

    getHistory() {
        return {
            messages: this.messages,
            summary: this.summary,
            totalMessages: this.messages.length
        };
    }
}

// Simple MCP tool execution
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

// Demo the memory functionality
async function demoMemory() {
    console.log('🧠 Memory System Demo');
    console.log('=====================\n');
    
    const memory = new ConversationMemory(5); // Small limit for demo
    
    // Simulate a conversation
    console.log('📝 Simulating a conversation about task scheduling...\n');
    
    // User creates a task
    memory.addMessage('user', 'Schedule a team meeting tomorrow at 3pm');
    const result1 = await executeMCPTool('create_task', {
        title: 'Team Meeting',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        tags: ['work']
    });
    memory.addMessage('assistant', `Created task: "${result1.task.title}" for tomorrow at 3pm`);
    
    console.log('✅ Task created:', result1.task.title);
    
    // User asks about tasks
    memory.addMessage('user', 'Show me my tasks');
    const result2 = await executeMCPTool('list_tasks', {});
    memory.addMessage('assistant', `Found ${result2.tasks.length} tasks including the team meeting`);
    
    console.log(`✅ Listed ${result2.tasks.length} tasks`);
    
    // User references previous task
    memory.addMessage('user', 'Change that meeting to 4pm instead');
    memory.addMessage('assistant', 'Updated the team meeting time to 4pm');
    
    // User creates another task
    memory.addMessage('user', 'Also schedule a doctor appointment for Friday');
    const result3 = await executeMCPTool('create_task', {
        title: 'Doctor Appointment',
        start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['health']
    });
    memory.addMessage('assistant', `Created task: "${result3.task.title}" for Friday`);
    
    console.log('✅ Task created:', result3.task.title);
    
    // Show memory context
    console.log('\n🧠 Current Memory Context:');
    console.log('=========================');
    const context = memory.getContextString();
    console.log(context);
    
    // Show memory statistics
    const history = memory.getHistory();
    console.log(`\nMemory Statistics:`);
    console.log(`- Total messages: ${history.totalMessages}`);
    console.log(`- Summary: ${history.summary || 'None yet'}`);
    
    // Demonstrate context awareness
    console.log('\n💡 Context Awareness Demo:');
    console.log('The system can now understand references like:');
    console.log('- "Delete that meeting" (refers to the team meeting)');
    console.log('- "What time is my appointment?" (refers to doctor appointment)');
    console.log('- "Reschedule the health-related task" (refers to doctor appointment)');
    
    console.log('\n✨ This context would be passed to the LLM for intelligent responses!');
}

demoMemory().catch(console.error);
