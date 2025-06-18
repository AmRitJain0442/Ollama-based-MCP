// mcp-server/mcp-server.js
// This is a proper MCP server implementation following the MCP protocol

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuration
const TASK_API_URL = process.env.TASK_API_URL || 'http://localhost:5000/api/tasks';

// MCP Server Information
const SERVER_INFO = {
    name: "task-scheduler-mcp",
    version: "1.0.0",
    description: "MCP server for task scheduling operations"
};

// Tool Definitions - These are crucial for MCP!
const TOOLS = [
    {
        name: "create_task",
        description: "Create a new task in the calendar. Use this when the user wants to schedule, add, or create a new task or event.",
        inputSchema: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "The title or name of the task"
                },
                description: {
                    type: "string",
                    description: "Optional detailed description of the task"
                },
                start: {
                    type: "string",
                    format: "date-time",
                    description: "Start date and time in ISO format (e.g., 2024-01-20T14:30:00)"
                },
                end: {
                    type: "string",
                    format: "date-time",
                    description: "End date and time in ISO format. If not provided, defaults to start time + 1 hour"
                },
                tags: {
                    type: "array",
                    items: {
                        type: "string",
                        enum: ["work", "personal", "family", "health", "other"]
                    },
                    description: "Categories for the task. Can include: work, personal, family, health, other"
                },
                color: {
                    type: "string",
                    description: "Hex color code for the task (e.g., #3788d8)"
                }
            },
            required: ["title", "start"]
        }
    },
    {
        name: "list_tasks",
        description: "List all scheduled tasks. Use this when the user wants to see, view, or check their tasks or schedule.",
        inputSchema: {
            type: "object",
            properties: {
                date: {
                    type: "string",
                    format: "date",
                    description: "Optional: filter tasks for a specific date (YYYY-MM-DD format)"
                },
                tags: {
                    type: "array",
                    items: {
                        type: "string"
                    },
                    description: "Optional: filter tasks by tags"
                }
            }
        }
    },
    {
        name: "update_task",
        description: "Update an existing task. Use this when the user wants to modify, change, or edit a task.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The ID of the task to update"
                },
                title: {
                    type: "string",
                    description: "New title for the task"
                },
                description: {
                    type: "string",
                    description: "New description for the task"
                },
                start: {
                    type: "string",
                    format: "date-time",
                    description: "New start date and time"
                },
                end: {
                    type: "string",
                    format: "date-time",
                    description: "New end date and time"
                },
                tags: {
                    type: "array",
                    items: {
                        type: "string"
                    },
                    description: "New tags for the task"
                },
                color: {
                    type: "string",
                    description: "New color for the task"
                }
            },
            required: ["id"]
        }
    },
    {
        name: "delete_task",
        description: "Delete a task from the calendar. Use this when the user wants to remove, delete, or cancel a task.",
        inputSchema: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The ID of the task to delete"
                }
            },
            required: ["id"]
        }
    },
    {
        name: "search_tasks",
        description: "Search for tasks by title or description. Use this when the user wants to find a specific task.",
        inputSchema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Search query to match against task titles and descriptions"
                }
            },
            required: ["query"]
        }
    }
];

// MCP Protocol Endpoints

// 1. Server Information Endpoint
app.get('/mcp/v1/server', (req, res) => {
    res.json({
        ...SERVER_INFO,
        capabilities: {
            tools: true,
            prompts: false,
            resources: false
        }
    });
});

// 2. List Tools Endpoint - This is what LLMs use to discover available functions
app.get('/mcp/v1/tools', (req, res) => {
    res.json({
        tools: TOOLS
    });
});

// 3. Execute Tool Endpoint - This is where the actual work happens
app.post('/mcp/v1/tools/:toolName', async (req, res) => {
    const { toolName } = req.params;
    const { arguments: args } = req.body;

    try {
        let result;
        
        switch (toolName) {
            case 'create_task':
                result = await createTask(args);
                break;
            case 'list_tasks':
                result = await listTasks(args);
                break;
            case 'update_task':
                result = await updateTask(args);
                break;
            case 'delete_task':
                result = await deleteTask(args);
                break;
            case 'search_tasks':
                result = await searchTasks(args);
                break;
            default:
                return res.status(404).json({
                    error: {
                        code: "TOOL_NOT_FOUND",
                        message: `Tool ${toolName} not found`
                    }
                });
        }

        res.json({
            result: result
        });
    } catch (error) {
        res.status(500).json({
            error: {
                code: "EXECUTION_ERROR",
                message: error.message
            }
        });
    }
});

// Tool Implementation Functions

async function createTask(args) {
    try {
        // Parse natural language dates if needed
        let startDate = new Date(args.start);
        let endDate = args.end ? new Date(args.end) : new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

        const taskData = {
            title: args.title,
            description: args.description || '',
            start: startDate,
            end: endDate,
            tags: args.tags || ['other'],
            color: args.color || '#3788d8'
        };

        const response = await axios.post(TASK_API_URL, taskData);
        
        return {
            success: true,
            task: response.data,
            message: `Task "${args.title}" created successfully`
        };
    } catch (error) {
        throw new Error(`Failed to create task: ${error.message}`);
    }
}

async function listTasks(args) {
    try {
        const response = await axios.get(TASK_API_URL);
        let tasks = response.data;

        // Apply filters if provided
        if (args.date) {
            const filterDate = new Date(args.date);
            tasks = tasks.filter(task => {
                const taskDate = new Date(task.start);
                return taskDate.toDateString() === filterDate.toDateString();
            });
        }

        if (args.tags && args.tags.length > 0) {
            tasks = tasks.filter(task => 
                task.tags.some(tag => args.tags.includes(tag))
            );
        }

        return {
            success: true,
            count: tasks.length,
            tasks: tasks.map(task => ({
                id: task._id,
                title: task.title,
                description: task.description,
                start: task.start,
                end: task.end,
                tags: task.tags,
                color: task.color
            }))
        };
    } catch (error) {
        throw new Error(`Failed to list tasks: ${error.message}`);
    }
}

async function updateTask(args) {
    try {
        const updateData = {};
        if (args.title !== undefined) updateData.title = args.title;
        if (args.description !== undefined) updateData.description = args.description;
        if (args.start !== undefined) updateData.start = new Date(args.start);
        if (args.end !== undefined) updateData.end = new Date(args.end);
        if (args.tags !== undefined) updateData.tags = args.tags;
        if (args.color !== undefined) updateData.color = args.color;

        const response = await axios.put(`${TASK_API_URL}/${args.id}`, updateData);
        
        return {
            success: true,
            task: response.data,
            message: "Task updated successfully"
        };
    } catch (error) {
        throw new Error(`Failed to update task: ${error.message}`);
    }
}

async function deleteTask(args) {
    try {
        await axios.delete(`${TASK_API_URL}/${args.id}`);
        
        return {
            success: true,
            message: "Task deleted successfully"
        };
    } catch (error) {
        throw new Error(`Failed to delete task: ${error.message}`);
    }
}

async function searchTasks(args) {
    try {
        const response = await axios.get(TASK_API_URL);
        const query = args.query.toLowerCase();
        
        const matchingTasks = response.data.filter(task => 
            task.title.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
        );

        return {
            success: true,
            count: matchingTasks.length,
            tasks: matchingTasks.map(task => ({
                id: task._id,
                title: task.title,
                description: task.description,
                start: task.start,
                end: task.end,
                tags: task.tags
            }))
        };
    } catch (error) {
        throw new Error(`Failed to search tasks: ${error.message}`);
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'task-scheduler-mcp' });
});

// Start the MCP server
const PORT = process.env.MCP_PORT || 6000;
app.listen(PORT, () => {
    console.log(`MCP Server running on port ${PORT}`);
    console.log(`Tools available: ${TOOLS.map(t => t.name).join(', ')}`);
});

// Example MCP Client Configuration (for reference)
const MCP_CLIENT_CONFIG = `
// Example configuration for Claude Desktop or other MCP clients
// Add this to your MCP client configuration file:

{
  "mcpServers": {
    "task-scheduler": {
      "command": "node",
      "args": ["./mcp-server/mcp-server.js"],
      "env": {
        "MCP_PORT": "6000"
      }
    }
  }
}

// For testing with Ollama or other LLMs, you can use this prompt:
/*
You have access to a task scheduling system through the following tools:

1. create_task - Create new tasks with title, description, start/end times, and tags
2. list_tasks - View all tasks or filter by date/tags  
3. update_task - Modify existing tasks
4. delete_task - Remove tasks
5. search_tasks - Find tasks by title or description

When users ask to schedule something, use create_task.
When they ask to see their schedule, use list_tasks.
Parse natural language dates like "tomorrow at 3pm" into ISO format.
Infer appropriate tags based on context (work, personal, family, health, other).
*/
`;

// Example test script for the MCP server
const TEST_SCRIPT = `
// test-mcp-server.js
const axios = require('axios');

async function testMCPServer() {
    const MCP_URL = 'http://localhost:6000';
    
    try {
        // 1. Get server info
        console.log('1. Testing server info...');
        const serverInfo = await axios.get(\`\${MCP_URL}/mcp/v1/server\`);
        console.log('Server:', serverInfo.data);
        
        // 2. List available tools
        console.log('\\n2. Testing tools listing...');
        const tools = await axios.get(\`\${MCP_URL}/mcp/v1/tools\`);
        console.log('Available tools:', tools.data.tools.map(t => t.name));
        
        // 3. Create a task
        console.log('\\n3. Testing task creation...');
        const createResult = await axios.post(\`\${MCP_URL}/mcp/v1/tools/create_task\`, {
            arguments: {
                title: "Team Meeting",
                description: "Weekly sync with the development team",
                start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                tags: ["work"]
            }
        });
        console.log('Create result:', createResult.data);
        
        // 4. List tasks
        console.log('\\n4. Testing task listing...');
        const listResult = await axios.post(\`\${MCP_URL}/mcp/v1/tools/list_tasks\`, {
            arguments: {}
        });
        console.log('Tasks:', listResult.data);
        
    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

testMCPServer();
`;

console.log('MCP Client Configuration Example:', MCP_CLIENT_CONFIG);
console.log('Test Script:', TEST_SCRIPT);