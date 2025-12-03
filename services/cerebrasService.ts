import { Message, MessageRole, FileAttachment } from '../types';
import { CEREBRAS_MODEL_NAME, DEFAULT_SYSTEM_PROMPT } from '../constants';

const API_ENDPOINT = "/api/chat";

export const initializeCerebrasService = (): boolean => {
  return true;
};

interface CerebrasChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const transformMessagesForCerebras = (messages: Message[]): CerebrasChatMessage[] => {
  return messages.map(msg => ({
    role: msg.role === MessageRole.MODEL ? 'assistant' : 'user',
    content: msg.text,
  }));
};

const removeThinkingTags = (text: string): string => {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*/gi, '')
    .trim();
};

export const sendMessageToCerebrasStream = async (
  history: Message[],
  userInput: string,
  onChunk: (chunkText: string) => void,
  onError: (error: string) => void,
  fileAttachment?: FileAttachment
): Promise<string> => {
  let requestContent = userInput;
  if (fileAttachment) {
    if (fileAttachment.type.startsWith('image/')) {
      requestContent = `Прикреплен файл изображения: ${fileAttachment.name} (Тип: ${fileAttachment.type}).\nСодержимое (base64):\n${fileAttachment.content}\n\n---\n\n${userInput}`;
    } else if (fileAttachment.type.startsWith('text/')) {
      requestContent = `Содержимое файла ${fileAttachment.name}:\n${fileAttachment.content}\n\n---\n\n${userInput}`;
    } else {
      requestContent = `Прикреплен файл: ${fileAttachment.name} (Тип: ${fileAttachment.type}). Учти его содержимое при ответе, если это релевантно.\n\n---\n\n${userInput}`;
    }
  }
  
  const messagesPayload: CerebrasChatMessage[] = [
    { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
    ...transformMessagesForCerebras(history),
    { role: 'user', content: requestContent }
  ];

  const requestBody = {
    model: CEREBRAS_MODEL_NAME,
    messages: messagesPayload,
    stream: true,
    max_completion_tokens: 40960,
    temperature: 0.6,
    top_p: 0.95
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Ошибка API: ${response.status} ${errorData.error || errorData.message || ''}`);
    }

    if (!response.body) {
      throw new Error("Ответ API не содержит тела для потоковой передачи.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponseText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line.startsWith('data: ')) {
          const jsonData = line.substring(6);
          if (jsonData.trim() === '[DONE]') {
            return removeThinkingTags(fullResponseText);
          }
          try {
            const parsed = JSON.parse(jsonData);
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
              const content = parsed.choices[0].delta.content;
              if (content) {
                fullResponseText += content;
                const cleanedFull = removeThinkingTags(fullResponseText);
                onChunk(cleanedFull);
              }
            }
          } catch (e) {
          }
        }
      }
      buffer = lines[lines.length - 1];
    }
    return removeThinkingTags(fullResponseText);

  } catch (error: any) {
    console.error("Ошибка при отправке сообщения:", error);
    let errorMessage = "Произошла ошибка при общении с ИИ.";
    if (error.message) {
      errorMessage += ` Детали: ${error.message}`;
    }
    if (error.message && error.message.includes("Failed to fetch")) {
      errorMessage = "Не удалось подключиться к серверу. Проверьте ваше интернет-соединение.";
    } else if (error.message && (error.message.toLowerCase().includes("unauthorized") || error.message.includes("401"))) {
      errorMessage = "Ошибка авторизации. Проверьте API ключ на сервере.";
    } else if (error.message && error.message.toLowerCase().includes("quota")) {
      errorMessage = "Превышена квота API. Пожалуйста, проверьте ваш биллинг или лимиты.";
    }
    onError(errorMessage);
    return "";
  }
};

export const extractFileAttachmentForPreview = async (file: File): Promise<FileAttachment | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    if (file.type.startsWith('text/') || file.name.match(/\.(js|ts|tsx|jsx|py|java|cpp|c|h|css|html|json|md|xml|yaml|yml|sh|sql|go|rs|php|rb|swift|kt)$/i)) {
      reader.onload = (e) => {
        resolve({
          name: file.name,
          type: file.type || 'text/plain',
          content: e.target?.result as string,
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      reader.onload = (e) => {
        const base64Content = (e.target?.result as string).split(',')[1]; 
        resolve({
          name: file.name,
          type: file.type,
          content: base64Content, 
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file); 
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      resolve({
        name: file.name,
        type: 'application/pdf',
        content: `[PDF файл: ${file.name}. Для анализа PDF требуется модель с поддержкой vision. Cerebras AI может работать только с текстовыми данными.]`,
      });
    } else {
      resolve({
        name: file.name,
        type: file.type,
        content: `[Файл: ${file.name}, Тип: ${file.type}]`,
      });
    }
  });
};
