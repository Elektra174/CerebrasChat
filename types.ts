
export enum MessageRole {
  USER = 'user',
  MODEL = 'model', // 'assistant' for Novita/OpenAI
  SYSTEM = 'system', // For internal system messages or context
  ERROR = 'error' // For displaying errors in chat
}

export interface FileAttachment {
  name: string;
  type: string; // MIME type
  content: string; // Base64 encoded or text content
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  fileAttachment?: FileAttachment;
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  // Novita API is stateless for chat turns, no specific chat object needed here
}
