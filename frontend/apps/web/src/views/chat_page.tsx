import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { getChatMessages, sendChatMessage } from '../service/api';

interface ChatMessage {
  id: number;
  item_id: number;
  message: string;
  is_user: boolean;
  conversation_id?: string;
  item: {
    id: number;
    kind: string;
    title: string;
    content?: string;
    created_at: string;
    updated_at: string;
  };
}

export function ChatPage(): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages so chat persists across navigation
  useEffect(() => {
    getChatMessages('default', 100, 0)
      .then((data) => setMessages(Array.isArray(data) ? data.reverse() : []))
      .catch(() => setMessages([]));
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    // Add user message to chat
    const tempUserMessage: ChatMessage = {
      id: Date.now(),
      item_id: 0,
      message: userMessage,
      is_user: true,
      conversation_id: 'default',
      item: {
        id: 0,
        kind: 'chat',
        title: `Chat message: ${userMessage.slice(0, 50)}...`,
        content: userMessage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      // Note: we are reversing the array because the backend returns newest first
      const savedMessage = await sendChatMessage({ message: userMessage, conversation_id: 'default' });
      setMessages(prev => [...prev.filter(msg => msg.id !== tempUserMessage.id), savedMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Keep the message in chat even if API fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen lg:max-h-[calc(100vh-8rem)]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">MyVault Chat</h1>
          <p className="text-sm text-gray-500">Always online</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">Send a message to get started</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.is_user
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 shadow-sm border'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.is_user ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.item.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200 sticky bottom-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
