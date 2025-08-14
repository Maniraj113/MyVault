import React from 'react';
import { Folder, Trash2, File } from 'lucide-react';
import { DocumentItem, DEFAULT_FOLDERS } from './types';

interface FolderViewProps {
  folders: string[];
  documents: DocumentItem[];
  onNavigateToFolder: (folder: string) => void;
  onDeleteFolder: (folder: string) => void;
  onViewDocument?: (doc: DocumentItem) => void;
}

export function FolderView({ folders, documents, onNavigateToFolder, onDeleteFolder, onViewDocument }: FolderViewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {folders.map((folder) => {
        const folderDocs = documents.filter(doc => doc.folder === folder);
        const folderCount = folderDocs.length;
        const isDefaultFolder = DEFAULT_FOLDERS.includes(folder);
        
        // Get first few image documents for preview
        const imageDocs = folderDocs.filter(doc => doc.fileType === 'image' && doc.fileUrl).slice(0, 4);
        
        return (
          <div
            key={folder}
            className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden p-4 text-center"
          >
            {/* Folder Preview - Show actual images if available */}
            <div 
              className="w-16 h-16 mx-auto mb-3 flex items-center justify-center bg-blue-50 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                if (imageDocs.length > 0 && onViewDocument) {
                  onViewDocument(imageDocs[0]);
                } else {
                  onNavigateToFolder(folder);
                }
              }}
            >
              {imageDocs.length > 0 ? (
                <div className="w-full h-full relative">
                  {/* Main preview image */}
                  <img 
                    src={imageDocs[0].fileUrl} 
                    alt="" 
                    className="w-full h-full object-cover hover:scale-110 transition-transform"
                    loading="lazy"
                  />
                  
                  {/* Overlay with count if more images */}
                  {imageDocs.length > 1 && (
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">+{imageDocs.length - 1}</span>
                    </div>
                  )}
                </div>
              ) : (
                <Folder className="w-8 h-8 text-blue-600" />
              )}
            </div>
            
            <h3 className="font-medium text-gray-900 mb-1 truncate">{folder}</h3>
            <p className="text-sm text-gray-500">
              {folderCount} document{folderCount !== 1 ? 's' : ''}
            </p>
            
            {/* Action Buttons */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onNavigateToFolder(folder)}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-medium"
              >
                Open
              </button>
              
              {/* Delete button - only for non-default folders */}
              {!isDefaultFolder && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder); }}
                  className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
