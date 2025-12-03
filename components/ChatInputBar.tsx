import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IconSend, IconMicrophone, IconPaperClip } from '../constants';
import { FileAttachment } from '../types';
import { extractFileAttachmentForPreview } from '../services/cerebrasService';

interface ChatInputBarProps {
  onSendMessage: (text: string, file?: FileAttachment) => void;
  isLoading: boolean;
}

const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [filePreview, setFilePreview] = useState<FileAttachment | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleSend = () => {
    if ((inputText.trim() || filePreview) && !isLoading) {
      onSendMessage(inputText.trim(), filePreview || undefined);
      setInputText('');
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const attachment = await extractFileAttachmentForPreview(file);
      if (attachment) {
        setFilePreview(attachment);
      } else {
        alert(`Неподдерживаемый тип файла: ${file.name}`);
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        alert("Распознавание речи не поддерживается вашим браузером.");
        return;
      }
      
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.lang = 'ru-RU';
        recognitionRef.current.interimResults = true; 
        recognitionRef.current.continuous = false;

        recognitionRef.current.onstart = () => setIsRecording(true);
        recognitionRef.current.onend = () => setIsRecording(false);
        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Ошибка распознавания речи:", event.error);
          setIsRecording(false);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            alert("Доступ к микрофону запрещен.");
          }
        };
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
             setInputText(prev => (prev ? prev + " " : "") + finalTranscript.trim());
          }
        };
      }
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        setIsRecording(false);
        console.error("Ошибка при запуске распознавания:", e);
      }
    }
  }, [isRecording]);
  
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return (
    <div className="p-4 md:p-5 glass-effect border-t border-dark-700/50">
      <div className="max-w-3xl mx-auto">
        {filePreview && (
          <div className="mb-3 p-3 bg-dark-800/50 rounded-xl border border-dark-600/50 flex justify-between items-center group fade-in">
            <div className="flex items-center gap-2 overflow-hidden">
              <IconPaperClip className="w-4 h-4 flex-shrink-0 text-accent-400" /> 
              <span className="text-sm text-dark-200 truncate">{filePreview.name}</span>
              <span className="text-xs text-dark-500">({filePreview.type.split('/')[1]})</span>
            </div>
            {filePreview.type.startsWith('image/') && filePreview.content && !filePreview.content.startsWith('[Файл:') && (
              <img src={`data:${filePreview.type};base64,${filePreview.content}`} alt="preview" className="max-h-10 max-w-[60px] ml-2 rounded object-contain"/>
            )}
            <button 
              onClick={() => { 
                setFilePreview(null); 
                if(fileInputRef.current) fileInputRef.current.value = "";
              }} 
              className="ml-3 p-1.5 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <button
            title="Прикрепить файл"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2.5 text-dark-400 hover:text-accent-400 hover:bg-dark-700/50 disabled:opacity-50 transition-all rounded-xl"
          >
            <IconPaperClip className="w-5 h-5" />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,text/plain,.pdf,.doc,.docx,.csv,.json,.md"/>
          
          <div className="flex-grow relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={isRecording ? "Говорите..." : "Напишите сообщение..."}
              rows={1}
              className="w-full p-3.5 bg-dark-800/50 border border-dark-600/50 rounded-xl resize-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 focus:outline-none placeholder-dark-500 text-dark-100 min-h-[48px] max-h-[200px] overflow-y-auto leading-relaxed input-glow transition-all"
              disabled={isLoading && !isRecording}
            />
          </div>
          
          <button
            title={isRecording ? "Остановить запись" : "Голосовой ввод"}
            onClick={toggleRecording}
            disabled={isLoading && !isRecording} 
            className={`p-2.5 rounded-xl transition-all ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
                : 'text-dark-400 hover:text-accent-400 hover:bg-dark-700/50'
            } disabled:opacity-50`}
          >
            <IconMicrophone className="w-5 h-5" />
          </button>
          
          <button
            title="Отправить"
            onClick={handleSend}
            disabled={isLoading || (!inputText.trim() && !filePreview)}
            className="p-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl disabled:opacity-50 disabled:hover:bg-accent-600 transition-all shadow-lg shadow-accent-600/20 hover:shadow-accent-500/30"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <IconSend className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInputBar;
