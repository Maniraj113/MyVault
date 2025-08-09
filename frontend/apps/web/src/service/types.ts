export type Item = {
  id: number;
  kind: 'link' | 'note' | 'doc' | 'expense' | 'task' | 'health';
  title: string;
  content?: string | null;
  created_at: string;
  updated_at: string;
};


