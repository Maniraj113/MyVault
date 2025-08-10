import React, { useState, useEffect, useRef } from 'react';
import { 
  FileImage, 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download, 
  Trash2, 
  Eye,
  File,
  Image as ImageIcon,
  Video,
  Music,
  Plus,
  X,
  Calendar,
  User
} from 'lucide-react';
import { uploadFile, deleteFile, getFileTypeFromMime, formatFileSize, UploadResult } from '../service/firebase';
import { createItem, listItems } from '../service/api';

interface Document {
  id: number;
  title: string;
  content?: string;
  created_at: string;
  updated_at: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'image' | 'document' | 'video' | 'audio';

export function DocsPage(): JSX.Element {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await listItems({ kind: 'doc', limit: 100 });
      setDocuments(docs.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
        fileUrl: item.content ? JSON.parse(item.content).fileUrl : undefined,
        fileName: item.content ? JSON.parse(item.content).fileName : undefined,
        fileSize: item.content ? JSON.parse(item.content).fileSize : undefined,
        fileType: item.content ? JSON.parse(item.content).fileType : undefined,
      })));
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploadResult = await uploadFile(file, 'documents');
        
        const docData = {
          kind: 'doc' as const,
          title: file.name,
          content: JSON.stringify({
            fileUrl: uploadResult.url,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.size,
            fileType: getFileTypeFromMime(file.type),
            originalName: file.name,
            mimeType: file.type
          })
        };

        await createItem(docData);
      }
      
      loadDocuments();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

    try {
      if (doc.fileName) {
        await deleteFile(doc.fileName);
      }
      // Note: Also need to implement delete API call for the item
      // await deleteItem(doc.id);
      loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && doc.fileType === filterType;
  });

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case 'video': return <Video className="w-8 h-8 text-red-500" />;
      case 'audio': return <Music className="w-8 h-8 text-green-500" />;
      case 'document': return <File className="w-8 h-8 text-gray-500" />;
      default: return <FileImage className="w-8 h-8 text-cyan-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileImage className="w-8 h-8 text-cyan-600" />
          <h1 className="text-2xl font-bold text-gray-900">Documents & Reports</h1>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Upload Files
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
          </select>
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-500'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Documents Grid/List */}
      <div className="flex-1 overflow-auto">
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileImage className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No documents found</p>
            <p className="text-sm">Upload your first document to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={() => setSelectedDoc(doc)}
                onDelete={() => handleDeleteDocument(doc)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onView={() => setSelectedDoc(doc)}
                onDelete={() => handleDeleteDocument(doc)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleFileUpload}
          isUploading={isUploading}
        />
      )}

      {/* Document Viewer */}
      {selectedDoc && (
        <DocumentViewer
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}

function DocumentCard({ document, onView, onDelete }: {
  document: Document;
  onView: () => void;
  onDelete: () => void;
}) {
  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case 'video': return <Video className="w-8 h-8 text-red-500" />;
      case 'audio': return <Music className="w-8 h-8 text-green-500" />;
      case 'document': return <File className="w-8 h-8 text-gray-500" />;
      default: return <FileImage className="w-8 h-8 text-cyan-500" />;
    }
  };

  return (
    <div className="group relative aspect-[3/4] bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {document.fileType === 'image' && document.fileUrl ? (
        <img
          src={document.fileUrl}
          alt={document.title}
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          {getFileIcon(document.fileType)}
          <p className="text-xs text-gray-600 mt-2 text-center line-clamp-3">{document.title}</p>
        </div>
      )}
      
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent rounded-b-lg p-2">
        <p className="text-white text-xs truncate">{document.title}</p>
      </div>
    </div>
  );
}

function DocumentRow({ document, onView, onDelete }: {
  document: Document;
  onView: () => void;
  onDelete: () => void;
}) {
  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'video': return <Video className="w-5 h-5 text-red-500" />;
      case 'audio': return <Music className="w-5 h-5 text-green-500" />;
      case 'document': return <File className="w-5 h-5 text-gray-500" />;
      default: return <FileImage className="w-5 h-5 text-cyan-500" />;
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      {getFileIcon(document.fileType)}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{document.title}</p>
        <p className="text-sm text-gray-500">
          {document.fileSize && formatFileSize(document.fileSize)} • {new Date(document.created_at).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function UploadModal({ onClose, onUpload, isUploading }: {
  onClose: () => void;
  onUpload: (files: FileList) => void;
  isUploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Upload Documents</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Drag and drop files here, or</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-cyan-600 hover:text-cyan-700 font-medium disabled:opacity-50"
          >
            click to browse
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Supports images, documents, videos, and audio files
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => e.target.files && onUpload(e.target.files)}
          className="hidden"
        />

        {isUploading && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
            <span className="ml-2 text-gray-600">Uploading...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentViewer({ document, onClose }: {
  document: Document;
  onClose: () => void;
}) {
  const canPreview = document.fileType === 'image' || document.fileType === 'document';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full h-full max-w-4xl max-h-[90vh] m-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900 truncate">{document.title}</h2>
          <div className="flex items-center gap-2">
            {document.fileUrl && (
              <a
                href={document.fileUrl}
                download={document.title}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Download className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {document.fileType === 'image' && document.fileUrl ? (
            <div className="p-4 flex items-center justify-center h-full">
              <img
                src={document.fileUrl}
                alt={document.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : document.fileType === 'video' && document.fileUrl ? (
            <div className="p-4 flex items-center justify-center h-full">
              <video
                src={document.fileUrl}
                controls
                className="max-w-full max-h-full"
              />
            </div>
          ) : document.fileType === 'audio' && document.fileUrl ? (
            <div className="p-8 flex items-center justify-center h-full">
              <audio src={document.fileUrl} controls />
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center h-full text-gray-500">
              <FileImage className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Preview not available</p>
              <p className="text-sm">Download the file to view its contents</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Created: {new Date(document.created_at).toLocaleString()}</span>
            {document.fileSize && <span>Size: {formatFileSize(document.fileSize)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}


