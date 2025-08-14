import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react';
import { DocumentItem } from './types';

interface ImageGalleryProps {
  documents: DocumentItem[];
  initialIndex?: number;
  onClose: () => void;
  onDelete: (doc: DocumentItem) => void;
}

export function ImageGallery({ documents, initialIndex = 0, onClose, onDelete }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Filter only image documents
  const imageDocs = documents.filter(doc => doc.fileType === 'image' && doc.fileUrl);
  
  if (imageDocs.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No images to display</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentDoc = imageDocs[currentIndex];
  const hasNext = currentIndex < imageDocs.length - 1;
  const hasPrev = currentIndex > 0;

  const goToNext = () => {
    if (hasNext) setCurrentIndex(currentIndex + 1);
  };

  const goToPrev = () => {
    if (hasPrev) setCurrentIndex(currentIndex - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'ArrowLeft') goToPrev();
    if (e.key === 'Escape') onClose();
  };

  const handleDownload = () => {
    if (currentDoc.fileUrl) {
      const link = document.createElement('a');
      link.href = currentDoc.fileUrl;
      link.download = currentDoc.title;
      link.click();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Arrows */}
      {hasPrev && (
        <button
          onClick={goToPrev}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Image */}
      <div className="relative max-w-full max-h-full">
        <img
          src={currentDoc.fileUrl}
          alt={currentDoc.title}
          className="max-w-full max-h-[80vh] object-contain"
        />
        
        {/* Image Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">{currentDoc.title}</h3>
              <p className="text-sm text-gray-300">{currentDoc.person}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(currentDoc)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {imageDocs.length > 1 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2">
          {imageDocs.map((doc, index) => (
            <button
              key={doc.id}
              onClick={() => setCurrentIndex(index)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <img
                src={doc.fileUrl}
                alt={doc.title}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Counter */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
        {currentIndex + 1} / {imageDocs.length}
      </div>
    </div>
  );
}
