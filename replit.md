# Нейрочат - Cerebras AI Chat Application

## Overview
A beautiful Russian-language chat application powered by Cerebras AI with a modern DeepSeek-inspired interface. Users can have conversations with an AI assistant, with support for multiple chat sessions, file attachments, and voice input.

## Project Architecture

### Technology Stack
- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom glassmorphism effects
- **AI Provider**: Cerebras AI (OpenAI-compatible API)
- **Model**: qwen-3-32b

### Project Structure
```
.
├── App.tsx              # Main application component
├── index.html           # Entry HTML with custom styling
├── index.tsx            # React entry point
├── types.ts             # TypeScript type definitions
├── constants.tsx        # Constants and icon components
├── components/
│   ├── ChatInputBar.tsx # Message input with voice/file support
│   └── ChatMessage.tsx  # Chat message display component
├── services/
│   └── cerebrasService.ts # Cerebras API integration
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies
```

## Environment Variables

### Required Secrets
- `CEREBRAS_API_KEY`: Your Cerebras AI API key (required)

## Development

### Running Locally
The application runs on port 5000 with `npm run dev`.

### Building for Production
```bash
npm run build
```

## Features
- Modern glassmorphism UI design
- Multiple chat sessions with localStorage persistence
- File attachments (images, text files)
- Voice input via Web Speech API
- Streaming responses from Cerebras AI
- Automatic filtering of thinking tags from AI responses
- Responsive sidebar navigation
- Russian language interface

## Recent Changes
- **December 2024**: Updated UI to modern DeepSeek-inspired design
- Added glassmorphism effects and gradient backgrounds
- Implemented thinking tag filtering for cleaner responses
- Improved animations and transitions

## User Preferences
- Interface language: Russian
- AI responds in Russian
- Clean output without thinking tags
