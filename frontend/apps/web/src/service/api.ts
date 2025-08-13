// Prefer relative proxy during dev to avoid CORS entirely; allow override in prod
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export type ListParams = { kind?: string; limit?: number; offset?: number };

// Items API
export async function listItems(params: ListParams = {}) {
  const qs = new URLSearchParams();
  if (params.kind) qs.set('kind', params.kind);
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.offset != null) qs.set('offset', String(params.offset));
  const res = await fetch(`${API_BASE}/items/?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load items');
  return (await res.json()) as any[];
}

export async function createItem(payload: { kind: string; title: string; content?: string }) {
  const res = await fetch(`${API_BASE}/items/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return await res.json();
}

// Chat API
export async function sendChatMessage(payload: { message: string; conversation_id?: string }) {
  const res = await fetch(`${API_BASE}/chat/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return await res.json();
}

export async function getChatMessages(conversation_id?: string, limit = 50, offset = 0) {
  const qs = new URLSearchParams();
  if (conversation_id) qs.set('conversation_id', conversation_id);
  qs.set('limit', String(limit));
  qs.set('offset', String(offset));
  
  const res = await fetch(`${API_BASE}/chat/messages?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load messages');
  return await res.json();
}

// Expenses API
export async function createExpense(payload: { 
  title: string; 
  content?: string; 
  amount: number; 
  category: string; 
  is_income?: boolean;
  occurred_on?: string;
}) {
  const res = await fetch(`${API_BASE}/expenses/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create expense');
  return await res.json();
}

export async function updateExpense(expenseId: string, payload: {
  title: string;
  content?: string;
  amount: number;
  category: string;
  is_income?: boolean;
  occurred_on?: string;
}) {
  const res = await fetch(`${API_BASE}/expenses/${expenseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update expense');
  return await res.json();
}

export async function getExpenses(params: {
  is_income?: boolean;
  category?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) qs.set(key, String(value));
  });
  
  const res = await fetch(`${API_BASE}/expenses/?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load expenses');
  return await res.json();
}

export async function getExpenseCategories() {
  const res = await fetch(`${API_BASE}/expenses/categories`);
  if (!res.ok) throw new Error('Failed to load categories');
  return await res.json();
}

// Tasks API
export async function createTask(payload: {
  title: string;
  content?: string;
  due_at?: string;
}) {
  const res = await fetch(`${API_BASE}/tasks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return await res.json();
}

export async function getTasks(params: {
  is_done?: boolean;
  due_date?: string;
  overdue?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) qs.set(key, String(value));
  });
  
  const res = await fetch(`${API_BASE}/tasks/?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load tasks');
  return await res.json();
}

export async function toggleTask(taskId: string) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/toggle`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to toggle task');
  return await res.json();
}

// Calendar API
export async function getCalendarEvents(params: {
  start_date: string;
  end_date: string;
  event_type?: 'tasks' | 'expenses' | 'all';
}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) qs.set(key, String(value));
  });
  
  const res = await fetch(`${API_BASE}/calendar/events?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load calendar events');
  return await res.json();
}

// Files API
export async function uploadFile(file: File, title?: string, content?: string, folder = 'documents') {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  if (content) formData.append('content', content);
  formData.append('folder', folder);

  const res = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload file');
  return await res.json();
}

export async function getFiles(params: {
  folder?: string;
  content_type?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) qs.set(key, String(value));
  });
  
  const res = await fetch(`${API_BASE}/files/?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load files');
  return await res.json();
}

export async function getFile(fileId: string) {
  const res = await fetch(`${API_BASE}/files/${fileId}`);
  if (!res.ok) throw new Error('Failed to load file');
  return await res.json();
}

export async function deleteFile(fileId: string) {
  const res = await fetch(`${API_BASE}/files/${fileId}`, { 
    method: 'DELETE' 
  });
  if (!res.ok) throw new Error('Failed to delete file');
  return await res.json();
}

export async function getFileDownloadUrl(fileId: string, signed = false) {
  const res = await fetch(`${API_BASE}/files/${fileId}/download?signed=${signed}`);
  if (!res.ok) throw new Error('Failed to get download URL');
  
  if (signed) {
    return await res.json();
  } else {
    // For public files, return the redirect URL
    return { download_url: res.url };
  }
}