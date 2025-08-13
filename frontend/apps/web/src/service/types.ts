export type Item = {
  id: string; // Firestore document id
  kind: 'link' | 'note' | 'doc' | 'expense' | 'task' | 'health' | 'chat' | 'file';
  title: string;
  content?: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

export type FileUpload = {
  id: string;
  item_id: string;
  original_filename: string;
  storage_path: string;
  storage_bucket: string;
  public_url: string;
  content_type: string;
  size: number;
  folder: string;
  uploaded_at: string;
  item: Item;
};


