import { useState } from 'react';
import { createItem, createExpense } from '../service/api';

type Props = { onCreated?: () => void };

// WhatsApp-like single input: parse quick patterns
export function MessageCapture({ onCreated }: Props): JSX.Element {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function handleSend(): Promise<void> {
    const value = text.trim();
    if (!value) return;
    setIsSending(true);
    try {
      // Pattern: expense like "coffee 25" or "coffee ₹25" -> amount last token
      const amountMatch = value.match(/(.+)\s(₹?)(\d+(?:\.\d+)?)/i);
      const isUrl = /^(https?:\/\/|www\.)/i.test(value);
      if (amountMatch && !isUrl) {
        const title = amountMatch[1].trim();
        const amount = parseFloat(amountMatch[3]);
        await createExpense({ title, amount, category: 'General' });
      } else if (isUrl) {
        await createItem({ kind: 'link', title: value, content: value });
      } else {
        await createItem({ kind: 'note', title: value });
      }
      setText('');
      onCreated?.();
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-card p-2 flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type like WhatsApp: 'Coffee 25', 'https://...', or a quick note"
        className="flex-1 rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      />
      <button
        onClick={handleSend}
        disabled={isSending}
        className="rounded-md bg-primary-600 text-white px-4 py-2 text-sm disabled:opacity-60"
      >
        Add
      </button>
    </div>
  );
}


