import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Edit3, Trash2, Check, X, Zap, MessageSquare } from 'lucide-react';
import { getChatMessages, sendChatMessage, updateChatMessage, deleteChatMessage } from '../service/api';

interface ChatMessage {
  id: string;
  item_id: string;
  message: string;
  is_user: boolean;
  conversation_id?: string;
  item: {
    id: string;
    kind: string;
    title: string;
    content?: string;
    created_at: string;
    updated_at: string;
  };
}

// Helper function to format date for display
const formatMessageDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper function to check if we should show date header
const shouldShowDateHeader = (currentMessage: ChatMessage, previousMessage?: ChatMessage): boolean => {
  if (!previousMessage) return true;
  const currentDate = new Date(currentMessage.item.created_at);
  const previousDate = new Date(previousMessage.item.created_at);
  return currentDate.toDateString() !== previousDate.toDateString();
};

// Helper function to format message text with proper line breaks and styling
const formatMessageText = (text: string): JSX.Element => {
  // Split by double line breaks for paragraphs
  const paragraphs = text.split('\n\n');
  
  return (
    <div className="space-y-2">
      {paragraphs.map((paragraph, index) => {
        // Split by single line breaks for line breaks within paragraphs
        const lines = paragraph.split('\n');
        
        return (
          <div key={index} className="space-y-1">
            {lines.map((line, lineIndex) => {
              // Handle bold text (text between **)
              const boldParts = line.split(/(\*\*.*?\*\*)/g);
              
              return (
                <div key={lineIndex}>
                  {boldParts.map((part, partIndex) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      // Bold text
                      return (
                        <strong key={partIndex} className="font-semibold">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    } else if (part.trim()) {
                      // Regular text
                      return <span key={partIndex}>{part}</span>;
                    } else {
                      // Empty line (preserve spacing)
                      return <br key={partIndex} />;
                    }
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

type ChatType = 'general' | 'running';

export function ChatPage(): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatType, setChatType] = useState<ChatType>('general');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages based on chat type
  useEffect(() => {
    let mounted = true;
    
    const conversationId = chatType === 'running' ? 'running' : 'general';
    
    getChatMessages(conversationId, 100, 0)
      .then((data) => {
        if (!mounted) return;
        const msgs = Array.isArray(data) ? data.slice().reverse() : [];
        setMessages(msgs);
        setError(null); // Clear any previous errors
      })
      .catch((error) => {
        console.error("Chat Page: Error loading chat messages:", error);
        
        // Show user-friendly error message
        if (error.message.includes('HTML instead of JSON')) {
          setError("Unable to connect to the backend server. Please check if the server is running.");
        } else {
          setError(`Failed to load chat messages: ${error.message}`);
        }
        
        setMessages([]);
      });
    return () => {
      mounted = false;
    };
  }, [chatType]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const conversationId = chatType === 'running' ? 'running' : 'general';
    
    try {
      setIsLoading(true);
      const response = await sendChatMessage({
        message: newMessage,
        conversation_id: conversationId
      });
      
      // Add the new message to the list
      const newMsg: ChatMessage = {
        id: response.id || Date.now().toString(),
        item_id: response.item_id || response.id || Date.now().toString(),
        message: newMessage,
        is_user: true,
        conversation_id: conversationId,
        item: {
          id: response.item_id || response.id || Date.now().toString(),
          kind: 'chat',
          title: newMessage,
          content: newMessage,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      // No demo responses - this is one-way communication only
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editingText.trim()) return;
    
    try {
      await updateChatMessage(messageId, editingText);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, message: editingText, item: { ...msg.item, title: editingText, content: editingText } }
            : msg
        )
      );
      setEditingId(null);
      setEditingText('');
    } catch (error) {
      console.error('Failed to update message:', error);
      setError('Failed to update message. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteChatMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      setError('Failed to delete message. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Chat Type Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setChatType('general')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              chatType === 'general'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            General Chat
          </button>
          <button
            onClick={() => setChatType('running')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              chatType === 'running'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-500 hover:text-teal-700 hover:bg-teal-50'
            }`}
          >
            <Zap className="w-4 h-4" />
            Running Chat
          </button>
        </div>
      </div>

      {/* Chat Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-emerald-600" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {chatType === 'running' ? 'Running Chat' : 'General Chat'}
            </h1>
            <p className="text-sm text-gray-500">
              {chatType === 'running' 
                ? 'Share running-related messages and information' 
                : 'General conversation and information sharing'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {messages.length === 0 && !error ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">
              {chatType === 'running' 
                ? 'No running messages yet. Start sharing your running updates!' 
                : 'No messages yet. Start the conversation!'
              }
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={message.id} className="flex flex-col">
              {shouldShowDateHeader(message, messages[index - 1]) && (
                <div className="text-center mb-4">
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                    {formatMessageDate(message.item.created_at)}
                  </span>
                </div>
              )}
              
              <div className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.is_user 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  {editingId === message.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        rows={3}
                        placeholder="Type your message with line breaks (use Enter for new lines)"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditMessage(message.id)}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditingText('');
                          }}
                          className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm">{formatMessageText(message.message)}</div>
                      {message.is_user && (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => {
                              setEditingId(message.id);
                              setEditingText(message.message);
                            }}
                            className="p-1 text-emerald-200 hover:text-white rounded"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(message.id)}
                            className="p-1 text-emerald-200 hover:text-white rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      
                      {/* Delete Confirmation */}
                      {deleteConfirmId === message.id && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                          <div className="text-red-800 mb-2">
                            Delete this message?
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Type your ${chatType === 'running' ? 'running-related ' : ''}message...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none min-h-[44px] max-h-32"
              rows={1}
              style={{ 
                minHeight: '44px',
                maxHeight: '128px',
                height: 'auto'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
              {/* Shift+Enter for new line text removed */}
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !newMessage.trim()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
