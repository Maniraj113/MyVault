import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Edit3, Trash2, Check, X } from 'lucide-react';
import { getChatMessages, sendChatMessage } from '../service/api';

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

async function updateMessage(messageId: string, message: string) {
  const res = await fetch(`/api/chat/messages/${messageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_id: 'default' }),
  });
  if (!res.ok) throw new Error('Failed to update message');
  return await res.json();
}

async function deleteMessage(messageId: string) {
  const res = await fetch(`/api/chat/messages/${messageId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete message');
  return true;
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

export function ChatPage(): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages so chat persists across navigation
  useEffect(() => {
    let mounted = true;
    console.log("Loading chat messages...");
    getChatMessages('default', 100, 0)
      .then((data) => {
        if (!mounted) return;
        console.log("Received chat data:", data);
        const msgs = Array.isArray(data) ? data.slice().reverse() : [];
        console.log("Processed messages:", msgs);
        setMessages(msgs);
      })
      .catch((error) => {
        console.error("Error loading chat messages:", error);
        setMessages([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const userMessage = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    const tempUserMessage: ChatMessage = {
      id: String(Date.now()),
      item_id: '',
      message: userMessage,
      is_user: true,
      conversation_id: 'default',
      item: {
        id: '',
        kind: 'chat',
        title: `Chat message: ${userMessage.slice(0, 50)}...`,
        content: userMessage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const savedMessage = await sendChatMessage({ message: userMessage, conversation_id: 'default' });
      setMessages(prev => [...prev.filter(msg => msg.id !== tempUserMessage.id), savedMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (message: ChatMessage) => {
    setEditingId(message.id);
    setEditingText(message.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const commitEdit = async () => {
    if (!editingId) return;
    const updated = await updateMessage(editingId, editingText);
    setMessages(prev => prev.map(m => (m.id === editingId ? updated : m)));
    cancelEdit();
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteMessage(id);
    if (ok) setMessages(prev => prev.filter(m => m.id !== id));
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
          <p className="text-sm text-gray-500">Your personal message storage</p>
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
          messages.map((message, index) => {
            console.log("Rendering message:", message);
            // Safety check for item field
            if (!message.item) {
              console.warn("Message missing item field:", message);
              return null; // Skip rendering this message
            }
            
            return (
              <React.Fragment key={message.id}>
                {/* Date Header */}
                {shouldShowDateHeader(message, messages[index - 1]) && (
                  <div className="flex justify-center my-4">
                    <div className="bg-white px-3 py-1 rounded-full shadow-sm border text-xs text-gray-600 font-medium">
                      {formatMessageDate(message.item.created_at)}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`group max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.is_user
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900 shadow-sm border'
                    }`}
                  >
                    {editingId === message.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full bg-white/10 text-inherit placeholder:text-inherit/60 border border-white/20 rounded p-2"
                          rows={3}
                        />
                        <div className="flex gap-2 justify-end">
                          <button onClick={commitEdit} className="p-1 rounded bg-emerald-600 text-white">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEdit} className="p-1 rounded bg-gray-300 text-gray-800">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                        <div className="flex items-center justify-between gap-3 mt-1">
                          <p className={`text-xs ${message.is_user ? 'text-blue-100' : 'text-gray-500'}`}>
                            {new Date(message.item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {message.is_user && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                              <button onClick={() => startEdit(message)} className="p-1 rounded bg-white/20 hover:bg-white/30">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(message.id)} className="p-1 rounded bg-white/20 hover:bg-white/30">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
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
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent whitespace-pre-wrap"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '160px' }}
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
