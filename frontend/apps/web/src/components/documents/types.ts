import React from 'react';
import { 
  Heart, Home, Award, Code, Shield, File
} from 'lucide-react';

export interface DocumentItem {
  id: string;
  title: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  category: DocumentCategory;
  person: string;
  folder: string;
  created_at: string;
  updated_at: string;
}

export type DocumentCategory = 'health' | 'home' | 'certificates' | 'technical' | 'insurance' | 'other';
export type ViewMode = 'grid' | 'list' | 'folders';

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'health', label: 'Health Documents', icon: Heart, color: 'text-red-600 bg-red-50' },
  { value: 'home', label: 'Home Documents', icon: Home, color: 'text-blue-600 bg-blue-50' },
  { value: 'certificates', label: 'Certificates', icon: Award, color: 'text-green-600 bg-green-50' },
  { value: 'technical', label: 'Technical Docs', icon: Code, color: 'text-purple-600 bg-purple-50' },
  { value: 'insurance', label: 'Insurance', icon: Shield, color: 'text-orange-600 bg-orange-50' },
  { value: 'other', label: 'Other', icon: File, color: 'text-gray-600 bg-gray-50' }
];

export const PEOPLE = ['Maniraj', 'Thirushanthini', 'Sanjay', 'Parents', 'Family'];

export const DEFAULT_FOLDERS = [
  'Personal',
  'Work', 
  'Medical',
  'Financial',
  'Education',
  'Travel',
  'Legal'
];
