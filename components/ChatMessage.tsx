import React, { useState } from 'react';
import { Message, MessageRole, FileAttachment } from '../types';
import { IconCopy, IconUser, IconSparkles, IconPaperClip } from '../constants';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === MessageRole.USER;
  const isError = message.role === MessageRole.ERROR;

  const renderTextContent = (text: string) => {
    return text.split('\n').map((line, index, arr) => (
      <React.Fragment key={index}>
        {line}
        {index < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  };
  
  const renderFileAttachment = (attachment: FileAttachment) => (
    <div className="mt-3 p-3 rounded-lg bg-dark-800/50 border border-dark-600/50 text-sm">
      <div className="flex items-center text-dark-300 gap-2">
        <IconPaperClip className="w-4 h-4 flex-shrink-0 text-accent-400" />
        <span className="truncate">{attachment.name}</span>
      </div>
      {attachment.type.startsWith('image/') && attachment.content && !attachment.content.startsWith('[Файл:') && (
        <img 
            src={`data:${attachment.type};base64,${attachment.content}`} 
            alt={attachment.name} 
            className="mt-3 max-w-xs max-h-48 rounded-lg object-contain"
        />
      )}
    </div>
  );

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 fade-in group">
        <div className="max-w-[85%] md:max-w-[70%]">
          {message.fileAttachment && renderFileAttachment(message.fileAttachment)}
          <div className="message-gradient-user rounded-2xl rounded-br-md px-4 py-3 shadow-lg shadow-accent-600/10">
            <div className="text-white text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
              {renderTextContent(message.text)}
            </div>
          </div>
          <div className="text-[11px] text-dark-500 mt-1.5 text-right pr-1">
            {new Date(message.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4 fade-in group">
      <div className="flex gap-3 max-w-[85%] md:max-w-[70%]">
        <div className="flex-shrink-0 mt-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isError ? 'bg-red-500/20' : 'bg-accent-600/20'}`}>
            <IconSparkles className={`w-4 h-4 ${isError ? 'text-red-400' : 'text-accent-400'}`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`rounded-2xl rounded-tl-md px-4 py-3 ${isError ? 'bg-red-500/10 border border-red-500/30' : 'message-gradient-bot'}`}>
            {message.isLoading && !message.text && (
              <div className="typing-indicator flex gap-1 py-1">
                <span className="w-2 h-2 bg-accent-400 rounded-full"></span>
                <span className="w-2 h-2 bg-accent-400 rounded-full"></span>
                <span className="w-2 h-2 bg-accent-400 rounded-full"></span>
              </div>
            )}
            <div className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words ${isError ? 'text-red-300' : 'text-dark-100'}`}>
              {renderTextContent(message.text)}
            </div>
            {message.isLoading && message.text && (
              <span className="inline-block w-1.5 h-4 bg-accent-400 ml-0.5 animate-pulse rounded-sm"></span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 pl-1">
            <span className="text-[11px] text-dark-500">
              {new Date(message.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {!isError && !message.isLoading && message.text && (
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-dark-500 hover:text-accent-400 hover:bg-dark-700/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                title={copied ? "Скопировано!" : "Копировать"}
              >
                {copied ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <IconCopy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
