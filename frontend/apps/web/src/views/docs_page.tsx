import React, { useEffect, useState, useCallback } from 'react';
import { Database, Upload, FolderPlus, X, Grid, Folder, RefreshCw } from 'lucide-react';
import { uploadFile, updateItem, deleteItem, getFiles } from '../service/api';
import { DocumentCard } from '../components/documents/DocumentCard';
import { ImageGallery } from '../components/documents/ImageGallery';
import { DocumentItem, DocumentCategory, DOCUMENT_CATEGORIES, PEOPLE, DEFAULT_FOLDERS } from '../components/documents/types';

export function DocsPage(): JSX.Element {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'folders' | 'grid'>('folders');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<string[]>([...DEFAULT_FOLDERS]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [cacheValid, setCacheValid] = useState<boolean>(false);
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<string | null>(null);

  const loadDocuments = useCallback(async (forceRefresh = false) => {
    // Cache for 10 minutes (600,000 ms) - increased for better performance
    const CACHE_DURATION = 10 * 60 * 1000;
    const now = Date.now();
    
    // Use cache if it's still valid and not forcing refresh
    if (!forceRefresh && cacheValid && (now - lastLoadTime) < CACHE_DURATION && documents.length > 0) {
      return;
    }
    
    setIsLoading(true);
    try {
      // Use the files API instead of items API to get actual file information
      const files = await getFiles({ limit: 100 });
      if (!Array.isArray(files) || files.length === 0) {
        setDocuments([]);
        setLastLoadTime(now);
        setCacheValid(true);
        return;
      }
      
      const processedDocs: DocumentItem[] = files.map(file => {
        const doc = {
          id: file.id,
          title: file.original_filename || file.title || 'Unknown',
          fileName: file.original_filename,
          fileUrl: file.public_url, // This is the actual image URL!
          fileSize: file.size || 0,
          fileType: getFileTypeFromMime(file.content_type),
          category: (file.category as DocumentCategory) || 'other' as DocumentCategory,
          person: file.person || 'Unknown',
          folder: file.user_folder || file.folder || 'Personal',
          created_at: file.uploaded_at || new Date().toISOString(),
          updated_at: file.uploaded_at || new Date().toISOString(),
        };
        return doc;
      });
      
      setDocuments(processedDocs);
      
      // Extract unique folders
      const uniqueFolders = [...new Set(processedDocs.map(doc => doc.folder))];
      setFolders([...DEFAULT_FOLDERS, ...uniqueFolders.filter(f => !DEFAULT_FOLDERS.includes(f))]);
      
      // Update cache info
      setLastLoadTime(now);
      setCacheValid(true);
      
      // Pre-cache image URLs for better performance
      const newImageCache = new Map();
      processedDocs.forEach(doc => {
        if (doc.fileType === 'image' && doc.fileUrl) {
          newImageCache.set(doc.id, doc.fileUrl);
        }
      });
      setImageCache(newImageCache);
      
    } catch (error) {
      console.error('Failed to load documents:', error);
      setError('Failed to load documents. Please try again.');
      setDocuments([]);
      setCacheValid(false);
    } finally {
      setIsLoading(false);
    }
  }, [cacheValid, lastLoadTime, documents.length]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const getFileTypeFromMime = (mimeType: string): string => {
    if (mimeType?.startsWith('image/')) return 'image';
    if (mimeType?.includes('pdf')) return 'pdf';
    return 'file';
  };

  const handleFileUpload = async (files: FileList, category: DocumentCategory, person: string, folder: string) => {
    if (!files.length) return;
    setIsUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        try {
          const uploadResult = await uploadFile(file, file.name, '', folder, category, person);
          
          // The uploadFile function already creates the file record, so we don't need to create an item
          // Just refresh the documents list
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }
      
      // Force refresh to get new documents
      setCacheValid(false);
      await loadDocuments(true);
      setShowUploadModal(false);
      setSuccess('Files uploaded successfully!');
      
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = (folderName: string) => {
    if (!folderName.trim() || folders.includes(folderName)) return;
    setFolders([...folders, folderName]);
    setShowFolderModal(false);
  };

  const handleDeleteFolder = async (folderName: string) => {
    try {
      const docsInFolder = documents.filter(doc => doc.folder === folderName);
      for (const doc of docsInFolder) {
        const updatedContent = {
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          fileType: doc.fileType,
          category: doc.category,
          person: doc.person,
          folder: 'Personal',
        };
        await updateItem(doc.id, { content: JSON.stringify(updatedContent) });
      }
      setFolders(prev => prev.filter(f => f !== folderName));
      setCacheValid(false);
      setSuccess(`Folder "${folderName}" deleted successfully!`);
      setDeleteFolderConfirm(null);
      loadDocuments(true);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      setError('Failed to delete folder. Please try again.');
    }
  };

  const handleDeleteDocument = async (doc: DocumentItem) => {
    try {
      // Delete the item from items collection
      await deleteItem(doc.id);
      setCacheValid(false);
      setSuccess(`Document "${doc.title}" deleted successfully!`);
      setDeleteConfirmId(null);
      loadDocuments(true);
      if (selectedDoc?.id === doc.id) {
        setSelectedDoc(null);
        setShowGallery(false);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      setError('Failed to delete document. Please try again.');
    }
  };

  const handleViewDocument = (doc: DocumentItem) => {
    if (doc.fileType === 'image' && doc.fileUrl) {
      setSelectedDoc(doc);
      setShowGallery(true);
    } else if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    } else {
      console.error('No file URL available for document:', doc);
      setError('File URL not available for this document');
    }
  };

  const currentDocuments = currentFolder 
    ? documents.filter(doc => doc.folder === currentFolder)
    : documents;

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium">{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">{success}</span>
            <button 
              onClick={() => setSuccess(null)} 
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-purple-600" />
          <h1 className="text-xl font-bold text-gray-900">Documents</h1>
          {isLoading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => loadDocuments(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowFolderModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Folder</span>
          </button>
        <button
          onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => setViewMode('folders')} 
            className={`p-2 rounded transition-colors ${viewMode === 'folders' ? 'bg-white shadow' : 'text-gray-500'}`}
          >
            <Folder className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('grid')} 
            className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500'}`}
          >
            <Grid className="w-4 h-4" />
        </button>
        </div>
      </div>

      {/* Back Navigation */}
      {currentFolder && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <button onClick={() => setCurrentFolder(null)} className="p-2 hover:bg-gray-200 rounded-lg">
            ←
          </button>
          <Folder className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">{currentFolder}</h2>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : viewMode === 'folders' && !currentFolder ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-8">
          {folders.map((folder) => {
            const docsInFolder = documents.filter(doc => doc.folder === folder);
            const docCount = docsInFolder.length;
            const hasImages = docsInFolder.some(doc => doc.fileType === 'image');
            const hasDocuments = docsInFolder.some(doc => doc.fileType !== 'image');
            
            return (
              <div
                key={folder}
                className="group relative bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => setCurrentFolder(folder)}
              >
                {/* Modern folder design */}
                <div className="relative mb-3">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Folder className="w-6 h-6 text-white" />
                  </div>
                  {hasImages && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{folder}</h3>
                  <p className="text-xs text-gray-500 mb-3">{docCount} document{docCount !== 1 ? 's' : ''}</p>
                  
                  {/* Modern action button */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm">
                      Browse
                    </div>
                  </div>
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl"></div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-6">
          {currentDocuments.map((doc) => (
            <DocumentCard 
              key={doc.id}
              document={doc}
              onView={() => handleViewDocument(doc)}
              onDelete={() => handleDeleteDocument(doc)}
              onFolderClick={() => setCurrentFolder(doc.folder)}
              />
            ))}
          </div>
        )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleFileUpload}
          isUploading={isUploading}
          folders={folders}
        />
      )}

      {/* Folder Modal */}
      {showFolderModal && (
        <FolderModal
          onClose={() => setShowFolderModal(false)}
          onCreate={handleCreateFolder}
        />
      )}

      {/* Image Gallery */}
      {showGallery && selectedDoc && (
        <ImageGallery
          documents={currentDocuments.filter(doc => doc.fileType === 'image' && doc.fileUrl)}
          initialIndex={currentDocuments.filter(doc => doc.fileType === 'image' && doc.fileUrl).findIndex(d => d.id === selectedDoc.id)}
          onClose={() => {
            setShowGallery(false);
            setSelectedDoc(null);
          }}
          onDelete={handleDeleteDocument}
        />
      )}
    </div>
  );
}

function UploadModal({ 
  onClose, 
  onUpload, 
  isUploading, 
  folders 
}: { 
  onClose: () => void; 
  onUpload: (files: FileList, category: DocumentCategory, person: string, folder: string) => void; 
  isUploading: boolean; 
  folders: string[]; 
}) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [person, setPerson] = useState(PEOPLE[0]);
  const [folder, setFolder] = useState(folders[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles) onUpload(selectedFiles, category, person, folder);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Upload Documents</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Person</label>
            <select
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
      </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              {DOCUMENT_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Folder</label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              {folders.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Files</label>
            <input
              type="file"
              multiple
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 border rounded-lg">
              Cancel
            </button>
        <button
              type="submit"
              disabled={!selectedFiles || isUploading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
        >
              {isUploading ? 'Uploading...' : 'Upload'}
        </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FolderModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [folderName, setFolderName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) onCreate(folderName.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Create Folder</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full px-3 py-2 border rounded-lg"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 border rounded-lg">
              Cancel
            </button>
          <button
              type="submit"
              disabled={!folderName.trim()}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
            >
              Create
          </button>
          </div>
        </form>
      </div>
    </div>
  );
}