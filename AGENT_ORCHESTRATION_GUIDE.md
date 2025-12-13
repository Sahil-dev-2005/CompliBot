# Agent Orchestration System Guide

## 🎭 Overview

CompliBot now features a sophisticated **Agent Orchestration System** where specialized sub-agents handle specific tasks while a root agent coordinates the entire conversation flow.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ROOT AGENT                               │
│                (AgentOrchestrator)                          │
│  • Routes messages to appropriate agents                    │
│  • Manages conversation state                               │
│  • Handles agent handoffs                                   │
│  • Provides fallback responses                              │
└─────────────────┬───────────────────┬───────────────────────┘
                  │                   │
         ┌────────▼────────┐ ┌────────▼────────┐
         │   SMS AGENT     │ │   JSON AGENT    │
         │                 │ │                 │
         │ • OTP generation│ │ • GST JSON gen  │
         │ • SMS composition│ │ • Return filing │
         │ • Verification  │ │ • Data validation│
         │ • Notifications │ │ • Tax calculation│
         └─────────────────┘ └─────────────────┘
```

## 🤖 Specialized Agents

### 1. SMS Agent (`SMSAgent`)
**Capabilities:**
- `generate_otp` - Generate and send OTP codes
- `verify_otp` - Verify user-provided OTP codes  
- `send_filing_reminder` - Send GST filing reminders
- `send_penalty_alert` - Send penalty notifications
- `compose_sms` - Create multilingual SMS content

**Conversation Flows:**
- **OTP Flow**: Request → Generate → Verify → Complete
- **Reminder Flow**: Request → Compose → Send → Complete
- **Alert Flow**: Request → Compose → Send → Complete

### 2. JSON Agent (`JSONAgent`)
**Capabilities:**
- `generate_gst_json` - Create GST return JSON files
- `validate_gst_json` - Validate JSON structure
- `file_gstr1` - Handle GSTR-1 returns
- `file_gstr3b` - Handle GSTR-3B returns
- `collect_invoice_data` - Gather invoice information
- `calculate_tax_summary` - Compute tax totals

**Conversation Flows:**
- **Filing Flow**: Return Type → Period → Data Collection → Generation → Validation → Filing
- **Data Entry Flow**: Manual → Step-by-step → Validation → Complete

## 🎯 Root Agent (Orchestrator)

The `AgentOrchestrator` serves as the central coordinator:

### Key Responsibilities:
1. **Message Routing** - Determines which agent should handle each message
2. **Conversation Management** - Tracks active conversations per user
3. **Agent Handoffs** - Transfers users between agents when needed
4. **Fallback Handling** - Provides responses when no agent can help
5. **Context Injection** - Passes user data to specialized agents

### Routing Logic:
```javascript
// Keyword-based routing
SMS Agent: ['otp', 'verify', 'sms', 'reminder', 'penalty']
JSON Agent: ['file', 'return', 'gstr', 'json', 'invoice']

// AI-powered routing for complex queries
analyzeIntent(message) → route to appropriate agent
```

## 💬 Conversation State Management

Each agent maintains its own conversation state:

```javascript
conversationState = {
  userId: {
    step: 2,
    task: 'otp_verification', 
    data: { gstin: '29ABCDE...', attempts: 2 },
    timestamp: 1640995200000
  }
}
```

### State Lifecycle:
1. **Initialize** - Agent starts conversation with user
2. **Update** - Agent updates state as conversation progresses  
3. **Clear** - Agent cleans up when conversation completes

## 🌐 Multilingual Support

All agents support English, Hindi, and Kannada:

```javascript
// Each agent has multilingual message templates
getMessages() {
  return {
    en: { otp_sent: 'OTP sent successfully!' },
    hi: { otp_sent: 'OTP सफलतापूर्वक भेजा गया!' },
    kn: { otp_sent: 'OTP ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ!' }
  }
}
```

## 🚀 Usage Examples

### Bot Commands:
- `/agents` - View agent system status
- `/reset_chat` - Clear all active conversations
- `/status` - Check user registration status

### User Interactions:

#### OTP Verification:
```
User: "I need OTP"
SMS Agent: "I need to send you an OTP for verification..."
User: "29ABCDE1234F1Z5"  
SMS Agent: "OTP sent successfully! Please enter the 6-digit code."
User: "123456"
SMS Agent: "OTP verified successfully! ✅"
```

#### GST Filing:
```
User: "File my GST return"
JSON Agent: "Which GST return would you like to file? 1. GSTR-1 2. GSTR-3B"
User: "2"
JSON Agent: "Please enter the filing period in MMYYYY format:"
User: "102025"
JSON Agent: "How would you like to provide invoice data? 1. Manual 2. Upload 3. Sample"
User: "3"
JSON Agent: "GST JSON generated successfully! ✅"
```

## 🔧 Technical Implementation

### Agent Base Class:
```javascript
class BaseAgent {
  constructor(name, capabilities)
  processMessage(userId, message, userData)
  initConversation(userId, initialData)
  getMessage(key, language, params)
}
```

### Specialized Agent Pattern:
```javascript
class SMSAgent extends BaseAgent {
  constructor() {
    super('SMSAgent', ['generate_otp', 'verify_otp', ...])
  }
  
  async processMessage(userId, message, userData) {
    // Handle SMS-specific logic
  }
}
```

### Orchestrator Integration:
```javascript
const orchestrator = new AgentOrchestrator()

// In bot message handler:
const result = await orchestrator.processMessage(chatId, message, userData)
ctx.reply(result.message)
```

## 📊 Monitoring & Debugging

### System Status:
```javascript
orchestrator.getSystemStatus()
// Returns: agents, capabilities, active conversations
```

### Conversation Management:
```javascript
orchestrator.clearUserConversations(userId)
orchestrator.handoffToAgent(userId, 'sms', context, userData)
```

## 🎯 Benefits

1. **Modularity** - Each agent handles specific domain expertise
2. **Scalability** - Easy to add new agents for new capabilities
3. **Maintainability** - Clear separation of concerns
4. **User Experience** - Contextual, conversational interactions
5. **Multilingual** - Consistent language support across all agents
6. **State Management** - Proper conversation flow handling

## 🔮 Future Extensions

- **Payment Agent** - Handle GST payment processing
- **Analytics Agent** - Provide business insights and reports  
- **Compliance Agent** - Check regulatory compliance
- **Document Agent** - Handle file uploads and processing
- **Notification Agent** - Manage scheduled reminders and alerts

The agent orchestration system provides a robust foundation for building complex, conversational GST assistance workflows while maintaining clean, maintainable code architecture.