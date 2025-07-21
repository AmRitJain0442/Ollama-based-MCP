# 🤖 MCP-Based Task Scheduler

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v7+-blue.svg)](https://www.mongodb.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Compatible-orange.svg)](https://ollama.ai/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A sophisticated task scheduling system that integrates **Model Context Protocol (MCP)** with **Ollama LLM**, featuring intelligent conversation memory, comprehensive validation, and natural language processing for seamless task management.

## 🌟 Key Features

### 🧠 **Intelligent Memory System**

- **Context Awareness**: Remembers all previous tasks and conversations
- **Smart References**: Understands "that meeting", "my appointment", "the task I mentioned"
- **Conversation History**: Maintains context across multiple interactions
- **Automatic Summarization**: Condenses older conversations while preserving important details

### 🛡️ **Safety & Validation**

- **Mandatory Confirmation**: All actions require explicit user approval
- **Missing Information Detection**: Asks for clarification when details are incomplete
- **Action Summaries**: Clear descriptions of what will happen before execution
- **Cancellation Support**: Easy to cancel any action at any time

### 🔌 **MCP Integration**

- **Protocol Compliance**: Full MCP server implementation
- **Tool Discovery**: Dynamic tool registration and discovery
- **Structured Communication**: JSON-based tool execution
- **Error Handling**: Robust error reporting and recovery

### 🎯 **Natural Language Processing**

- **Ollama Integration**: Supports multiple LLM models (llama2, mistral, codellama)
- **Date/Time Parsing**: Converts "tomorrow at 3pm" to proper ISO format
- **Smart Tag Inference**: Automatically categorizes tasks (work, personal, family, health, other)
- **Context-Aware Responses**: Uses conversation history for intelligent replies

## 🏗️ Architecture

```
📁 Project Structure
├── 🖥️  backend/                 # Express.js API Server
│   ├── server.js               # Main server entry point
│   ├── models/                 # MongoDB data models
│   │   └── Task.js            # Task schema definition
│   └── routes/                 # API route handlers
│       └── tasks.js           # Task CRUD operations
├── 🌐 frontend/                # Web Interface
│   └── index.html             # Simple web UI
├── 🔌 mcp-server/              # Model Context Protocol Server
│   └── mcp-server.js          # MCP protocol implementation
├── 🤖 mcp-ollama-client.js     # Enhanced AI client with memory
├── 📋 test-memory.js           # Memory system testing
├── 🎭 demo-*.js               # Interactive demo scripts
└── 📦 package.json            # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20+
- **MongoDB** running on localhost:27017
- **Ollama** (optional, for AI features)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/AmRitJain0442/Ollama-based-MCP.git
cd Mcp-based-task-scheduler

# Install dependencies
npm install
```

### 2. Start the Services

```bash
# Terminal 1: Start MongoDB (ensure it's running)
# mongod

# Terminal 2: Start the backend server
npm start
# Should show: "Server running on port 5000" and "MongoDB connected"

# Terminal 3: Start the MCP server
npm run mcp
# Should show: "MCP Server running on port 6000"

# Terminal 4: Start the enhanced client
npm run client
# Starts the AI-powered client with memory and validation
```

### 3. Alternative Startup (Development)

```bash
# Start backend and MCP server together
npm run dev

# In another terminal, start the client
npm run client
```

## 🎮 Usage Examples

### Natural Language Interactions

#### Creating Tasks

```bash
You: Schedule a team meeting tomorrow at 3pm
🤖 Assistant: Creating a work meeting for tomorrow at 3pm

📋 Action Summary: Create "Team meeting" on July 22, 2025 from 3:00 PM to 4:00 PM with work tag

❓ Do you want me to proceed with this action? (y/n): y

⏳ Executing...
✅ Task created successfully!
  📅 Team meeting
     Date: 7/22/2025
     Time: 3:00 PM - 4:00 PM
     Tags: work
```

#### Smart References

```bash
You: Reschedule that meeting to 4pm
🤖 Assistant: I'll update the team meeting we just created to 4pm

📋 Action Summary: Update "Team meeting" start time from 3:00 PM to 4:00 PM

❓ Do you want me to proceed with this action? (y/n): y

✅ Task updated successfully!
```

#### Missing Information Handling

```bash
You: Schedule a meeting
🤖 Assistant: 🤔 I need more details to schedule your meeting

I need the following information:
  1. meeting title/topic
  2. date and time
  3. duration or end time

Please provide more details and try again.
```

### Memory Commands

```bash
# View conversation history
You: memory
📚 Conversation History:
1. [14:30:15] You: Schedule a team meeting tomorrow at 3pm
2. [14:30:16] Assistant: Created "Team meeting" for tomorrow at 3pm
3. [14:31:20] You: Reschedule that meeting to 4pm
4. [14:31:21] Assistant: Updated the team meeting time to 4pm

Total messages: 8

# Clear conversation history
You: clear memory
✅ Conversation history cleared!

# Exit with summary
You: exit
📝 Conversation Summary: Created 2 tasks, updated 1 meeting time.
Total messages in this session: 8
Goodbye!
```

## 🛠️ Available Scripts

| Command                   | Description                             |
| ------------------------- | --------------------------------------- |
| `npm start`               | Start the backend server                |
| `npm run mcp`             | Start the MCP server                    |
| `npm run client`          | Start the enhanced AI client            |
| `npm run dev`             | Start backend + MCP server together     |
| `npm run demo-validation` | Interactive demo of validation features |
| `npm run test-memory`     | Test memory functionality               |

## 🔧 API Endpoints

### Backend Server (Port 5000)

- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### MCP Server (Port 6000)

- `GET /mcp/v1/server` - Server information
- `GET /mcp/v1/tools` - Available tools
- `POST /mcp/v1/tools/{tool_name}` - Execute tool

### Available MCP Tools

- **create_task** - Create new tasks
- **list_tasks** - List all tasks (with optional filtering)
- **update_task** - Modify existing tasks
- **delete_task** - Remove tasks
- **search_tasks** - Find tasks by title/description

## 🧪 Testing & Demo

### Memory System Demo

```bash
npm run test-memory
```

Creates sample tasks and demonstrates memory functionality.

### Validation Features Demo

```bash
npm run demo-validation
```

Interactive demonstration of:

- Missing information handling
- Confirmation workflows
- Smart reference resolution
- CLI mode features

### Manual Testing

1. Start all services
2. Run the client: `npm run client`
3. Try these commands:
   ```
   - "Schedule a meeting with John tomorrow at 2pm"
   - "Show me my tasks"
   - "Delete that meeting"
   - "What tasks did I create today?"
   ```

## 📊 Data Models

### Task Schema

```javascript
{
  title: String,           // Required: Task title
  description: String,     // Optional: Task description
  start: Date,            // Required: Start date/time (ISO format)
  end: Date,              // Optional: End date/time (auto-calculated if missing)
  tags: [String],         // Array: work, personal, family, health, other
  color: String,          // Optional: Hex color for UI (default: #3788d8)
  createdAt: Date,        // Auto: Creation timestamp
  updatedAt: Date         // Auto: Last update timestamp
}
```

### Memory Structure

```javascript
{
  messages: [
    {
      role: "user" | "assistant",
      content: String,
      timestamp: String
    }
  ],
  summary: String,        // Condensed older conversations
  maxMessages: Number     // Configurable limit (default: 15)
}
```

## ⚙️ Configuration

### Environment Variables

```bash
# Optional: Custom ports
PORT=5000                 # Backend server port
MCP_PORT=6000            # MCP server port

# Optional: Custom MongoDB connection
MONGODB_URI=mongodb://localhost:27017/taskscheduler
```

### Client Configuration

```javascript
// In mcp-ollama-client.js
const OLLAMA_URL = "http://localhost:11434/api/generate";
const MCP_SERVER_URL = "http://localhost:6000";
const MODEL_NAME = "llama2"; // or 'mistral', 'codellama', etc.

// Memory settings
const conversationMemory = new ConversationMemory(15); // Keep last 15 messages
```

## 🔌 MCP Protocol Details

### Tool Schema Example

```json
{
  "name": "create_task",
  "description": "Create a new task with title, description, dates, and tags",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": { "type": "string", "description": "Task title" },
      "description": { "type": "string", "description": "Task description" },
      "start": { "type": "string", "format": "date-time" },
      "end": { "type": "string", "format": "date-time" },
      "tags": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["title", "start"]
  }
}
```

### Execution Response Format

```json
{
  "result": {
    "success": true,
    "task": {
      /* created task object */
    },
    "message": "Task created successfully"
  }
}
```

## 🛡️ Security Features

### Input Validation

- **Sanitization**: All inputs are sanitized before processing
- **Type Checking**: Strict type validation for all parameters
- **Date Validation**: Proper ISO date format enforcement
- **Tag Validation**: Restricted to predefined tag values

### Error Handling

- **Graceful Degradation**: System continues working even with partial failures
- **User-Friendly Messages**: Clear error descriptions and suggestions
- **Context Preservation**: Memory maintains state during errors
- **Automatic Recovery**: Smart retry mechanisms for network issues

## 🎯 Advanced Use Cases

### Batch Operations

```bash
You: Delete all my work meetings for next week
🤖 Assistant: I found 5 work meetings next week. Do you want to delete all of them?
```

### Smart Scheduling

```bash
You: Schedule lunch with Sarah
🤖 Assistant: When would you like to schedule lunch with Sarah?
You: How about Friday?
🤖 Assistant: What time on Friday works for you?
```

### Context-Aware Updates

```bash
You: Make my 3pm meeting 30 minutes longer
🤖 Assistant: I'll extend your "Team meeting" from 4:00 PM to 4:30 PM
```

## 🚦 Troubleshooting

### Common Issues

#### MongoDB Connection Failed

```bash
# Ensure MongoDB is running
mongod

# Check connection
mongosh mongodb://localhost:27017
```

#### MCP Server Not Responding

```bash
# Check if port 6000 is in use
netstat -an | grep 6000

# Restart MCP server
npm run mcp
```

#### Ollama Not Detected

```bash
# Install Ollama
# Visit: https://ollama.ai

# Pull a model
ollama pull llama2

# Verify it's running
curl http://localhost:11434/api/tags
```

#### Memory Issues

- **High Memory Usage**: Reduce `maxMessages` in ConversationMemory
- **Lost Context**: Check if memory was cleared accidentally
- **Poor References**: Ensure descriptive task names for better matching

## 🔄 Development Workflow

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`
2. **MCP Tools**: Update `mcp-server/mcp-server.js`
3. **Client**: Modify `mcp-ollama-client.js`
4. **Testing**: Create test scripts in root directory

### Code Structure

- **Modular Design**: Each component is self-contained
- **Error Boundaries**: Comprehensive error handling throughout
- **Configuration**: Environment-based configuration
- **Documentation**: Inline code documentation

## 📈 Performance Considerations

### Optimization Features

- **Memory Management**: Automatic cleanup of old conversations
- **Database Indexing**: Optimized queries for task retrieval
- **Caching**: In-memory caching for frequently accessed data
- **Async Operations**: Non-blocking I/O throughout the application

### Scalability

- **Horizontal Scaling**: Multiple MCP server instances supported
- **Load Balancing**: Can be deployed behind load balancers
- **Database Sharding**: MongoDB supports horizontal partitioning
- **Microservices**: Clean separation between components

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for changes
- Ensure backward compatibility

## 🗺️ Roadmap

### Short Term

- [ ] Persistent memory storage in database
- [ ] User authentication and profiles
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Mobile-responsive web interface

### Medium Term

- [ ] Voice interface with speech-to-text
- [ ] Smart notifications and reminders
- [ ] Team collaboration features
- [ ] Advanced analytics and reporting

### Long Term

- [ ] Multi-language support
- [ ] AI-powered scheduling suggestions
- [ ] Integration with productivity tools
- [ ] Plugin architecture for extensions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama Team** - For the excellent local LLM platform
- **MongoDB Team** - For the robust database solution
- **Model Context Protocol** - For the standardized AI tool integration
- **Node.js Community** - For the amazing ecosystem

## 📞 Support

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/AmRitJain0442/Ollama-based-MCP/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AmRitJain0442/Ollama-based-MCP/discussions)
- **Documentation**: See [README-MEMORY.md](README-MEMORY.md) and [README-VALIDATION.md](README-VALIDATION.md)

### Reporting Bugs

Please include:

- Steps to reproduce the issue
- Expected vs actual behavior
- System information (OS, Node.js version, etc.)
- Relevant logs or error messages

---

**🚀 Built with intelligence, safety, and user experience in mind**

_Star ⭐ this repository if you find it helpful!_
