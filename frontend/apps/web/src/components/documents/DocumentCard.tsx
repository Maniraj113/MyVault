import React from 'react';
import { Eye, Trash2, File } from 'lucide-react';
import { DocumentItem, DOCUMENT_CATEGORIES } from './types';

interface DocumentCardProps {
  document: DocumentItem;
  onView: () => void;
  onDelete: () => void;
  onFolderClick: () => void;
}

export function DocumentCard({ document: doc, onView, onDelete, onFolderClick }: DocumentCardProps) {
  const category = DOCUMENT_CATEGORIES.find(c => c.value === doc.category);
  const CategoryIcon = category?.icon || File;

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden" onClick={onView}>
      {/* File Preview - Always try to show image first */}
      <div className="aspect-square overflow-hidden bg-gray-50 relative">
        {doc.fileType === 'image' && doc.fileUrl ? (
          <img 
            src={doc.fileUrl} 
            alt={doc.title} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
            loading="lazy"
            onError={(e) => {
              // If image fails, show fallback icon
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
        ) : null}
        
        {/* Fallback icon - always present but hidden if image loads */}
        <div className={`${doc.fileType === 'image' && doc.fileUrl ? 'hidden' : ''} absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100`}>
          <CategoryIcon className="w-8 h-8 text-gray-500" />
        </div>
        
        {/* Image overlay for better UX */}
        {doc.fileType === 'image' && doc.fileUrl && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>
        )}
      </div>
      
      {/* Simplified Document Info - Only title and essential info */}
      <div className="p-3 space-y-2">
        {/* Title - Most important */}
        <p className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight" title={doc.title}>
          {doc.title}
        </p>
        
        {/* Minimal info - just person name */}
        <div className="text-xs text-gray-500">
          <span className="text-blue-600">{doc.person}</span>
        </div>
      </div>

      {/* Action Buttons - Always visible */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button 
          onClick={(e) => { e.stopPropagation(); onView(); }} 
          className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
          title="View"
        >
          <Eye className="w-3 h-3 text-gray-600" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }} 
          className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
        </button>
      </div>
    </div>
  );
}
