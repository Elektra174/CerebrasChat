import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatSession, Message, MessageRole, FileAttachment } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInputBar from './components/ChatInputBar';
import { initializeCerebrasService, sendMessageToCerebrasStream } from './services/cerebrasService'; 
import { IconPlus, IconTrash, IconMenu, IconClose, IconSparkles } from './constants';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceInitialized, setServiceInitialized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialized = initializeCerebrasService();
    setServiceInitialized(initialized);

    const storedSessions = localStorage.getItem('chatSessionsCerebras');
    if (storedSessions) {
      const parsedSessions: ChatSession[] = JSON.parse(storedSessions);
      setSessions(parsedSessions);
      if (parsedSessions.length > 0) {
        const lastSessionId = localStorage.getItem('activeSessionIdCerebras');
        const sessionToLoad = parsedSessions.find(s => s.id === lastSessionId) || parsedSessions[0];
        if(sessionToLoad) setActiveSessionId(sessionToLoad.id);
      } else {
        createNewSession();
      }
    } else {
      createNewSession();
    }
    
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('chatSessionsCerebras', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('activeSessionIdCerebras', activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isLoading]);

  const createNewSession = useCallback(() => {
    setErrorMessage(null);
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `Новый чат ${sessions.length + 1}`,
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, [sessions, serviceInitialized]);

  const switchSession = (sessionId: string) => {
    if (errorMessage && errorMessage.includes("API")) {
        setErrorMessage(null);
    }
    setActiveSessionId(sessionId);
  };

  const deleteSession = (sessionId: string) => {
    const remainingSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(remainingSessions);
    if (activeSessionId === sessionId) {
      if (remainingSessions.length > 0) {
        const deletedIndexInOriginal = sessions.findIndex(s => s.id === sessionId);
        let newActiveSession: ChatSession | undefined;
        if (deletedIndexInOriginal > 0 && sessions[deletedIndexInOriginal -1]) {
            newActiveSession = sessions[deletedIndexInOriginal-1];
        } else if (sessions[deletedIndexInOriginal + 1]) {
            newActiveSession = sessions[deletedIndexInOriginal + 1];
        } else {
            newActiveSession = remainingSessions[0];
        }
        setActiveSessionId(newActiveSession ? newActiveSession.id : null);
      } else {
        createNewSession();
      }
    }
  };
  
  const renameSession = (sessionId: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle.trim() || s.title } : s));
  };

  const addMessageToSession = (sessionId: string, message: Message) => {
    setSessions(prev =>
      prev.map(s =>
        s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
      )
    );
  };

  const updateLastMessageInSession = (sessionId: string, updateFn: (lastMessage: Message) => Message) => {
     setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId && s.messages.length > 0) {
          const lastMessageIndex = s.messages.length - 1;
          const updatedMessages = [...s.messages];
          updatedMessages[lastMessageIndex] = updateFn(updatedMessages[lastMessageIndex]);
          return { ...s, messages: updatedMessages };
        }
        return s;
      })
    );
  }

  const handleSendMessage = async (text: string, file?: FileAttachment) => {
    if (!activeSessionId || isLoading || (!text.trim() && !file)) return;
    
    const currentSessionForHistory = sessions.find(s => s.id === activeSessionId);
    if (!currentSessionForHistory) return;

    if (!serviceInitialized) {
      if (!initializeCerebrasService()) {
        const errorMsg = `Сервис AI не инициализирован. Проверьте API ключ.`;
        setErrorMessage(errorMsg);
        addMessageToSession(activeSessionId, { id: Date.now().toString(), role: MessageRole.ERROR, text: errorMsg, timestamp: Date.now() });
        return;
      }
       setServiceInitialized(true);
    }
    
    setIsLoading(true);
    setErrorMessage(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: text,
      timestamp: Date.now(),
      fileAttachment: file 
    };
    addMessageToSession(activeSessionId, userMessage);

    const modelMessageId = (Date.now() + 1).toString();
    addMessageToSession(activeSessionId, {
      id: modelMessageId,
      role: MessageRole.MODEL,
      text: '',
      timestamp: Date.now(),
      isLoading: true,
    });
    
    let fullModelResponse = "";
    try {
        const historyForApi = currentSessionForHistory.messages.slice(0, -1)
                                 .filter(m => m.role === MessageRole.USER || m.role === MessageRole.MODEL);

        await sendMessageToCerebrasStream(
            historyForApi,
            text,
            (cleanedText) => { 
                fullModelResponse = cleanedText;
                updateLastMessageInSession(activeSessionId, msg => ({ ...msg, text: cleanedText, isLoading: true }));
            },
            (errorText) => { 
                setErrorMessage(errorText);
                updateLastMessageInSession(activeSessionId, msg => ({ ...msg, text: errorText, role: MessageRole.ERROR, isLoading: false }));
            },
            file 
        );
    } catch (e: any) {
        const errorText = `Ошибка: ${e.message || "Неизвестная ошибка"}`;
        setErrorMessage(errorText);
        updateLastMessageInSession(activeSessionId, msg => ({ ...msg, text: errorText, role: MessageRole.ERROR, isLoading: false }));
    } finally {
        updateLastMessageInSession(activeSessionId, msg => ({ 
            ...msg, 
            text: fullModelResponse || (msg.role === MessageRole.ERROR ? msg.text : "Ответ не получен."),
            isLoading: false, 
            role: msg.role === MessageRole.ERROR ? MessageRole.ERROR : MessageRole.MODEL 
        }));
        setIsLoading(false);
        const currentSessionToUpdate = sessions.find(s => s.id === activeSessionId);
        if (currentSessionToUpdate && currentSessionToUpdate.messages.length <= 2 && text.trim()) { 
           const newTitle = text.trim().substring(0, 30) + (text.trim().length > 30 ? '...' : '');
           renameSession(activeSessionId, newTitle);
        }
    }
  };
  
  const currentSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="flex h-screen overflow-hidden antialiased">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-30 w-72 glass-effect transform transition-all duration-300 ease-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-5 flex justify-between items-center border-b border-dark-700/50">
            <h1 className="text-lg font-semibold text-accent-400 flex items-center gap-2">
              <IconSparkles className="w-5 h-5"/> Нейрочат
            </h1>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-dark-400 hover:text-white transition-colors">
              <IconClose className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={createNewSession}
            disabled={isLoading}
            className="mx-4 mt-4 p-3 bg-accent-600/20 hover:bg-accent-600/30 text-accent-400 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-200 border border-accent-600/30 hover:border-accent-500/50 font-medium"
          >
            <IconPlus className="w-4 h-4" /> Новый чат
          </button>
          
          <nav className="flex-grow p-4 space-y-2 overflow-y-auto custom-scroll mt-2">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => switchSession(session.id)}
                className={`p-3 rounded-xl cursor-pointer group transition-all duration-200 hover-scale ${
                  activeSessionId === session.id 
                    ? 'bg-accent-600/20 border border-accent-500/30 shadow-lg shadow-accent-500/10' 
                    : 'hover:bg-dark-700/50 border border-transparent'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`truncate flex-1 text-sm font-medium ${activeSessionId === session.id ? 'text-accent-300' : 'text-dark-200'}`}>
                    {session.title}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                    className="ml-2 p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Удалить"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-dark-500 mt-1.5">
                    {new Date(session.createdAt).toLocaleString('ru-RU', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="glass-effect p-4 flex items-center gap-3 border-b border-dark-700/50">
           <button onClick={() => setSidebarOpen(true)} className="md:hidden text-dark-400 hover:text-white transition-colors p-2 -ml-2">
             <IconMenu className="w-5 h-5" />
           </button>
           <div className="flex-1">
             <h2 className="text-base font-medium text-dark-100 truncate">
               {currentSession?.title || 'Чат'}
             </h2>
           </div>
        </header>
        
        {errorMessage && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm fade-in">
            {errorMessage}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scroll">
          {currentSession?.messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 fade-in">
              <div className="w-16 h-16 rounded-2xl bg-accent-600/20 flex items-center justify-center mb-6">
                <IconSparkles className="w-8 h-8 text-accent-400"/>
              </div>
              <h3 className="text-xl font-semibold text-dark-100 mb-2">Добро пожаловать!</h3>
              <p className="text-dark-400 max-w-md">
                Начните диалог с AI-ассистентом. Задайте любой вопрос или попросите помощь с задачей.
              </p>
            </div>
          )}
          
          <div className="max-w-3xl mx-auto space-y-4">
            {currentSession?.messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>
          <div ref={messagesEndRef} />
        </main>
        
        <ChatInputBar onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default App;
