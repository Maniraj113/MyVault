import React, { useState, useEffect, useRef } from 'react';
import { Upload, File, Image, Trash2, Download, Eye, Plus, X } from 'lucide-react';
import { PageHeader } from '../ui/page_header';
import { uploadFile, getFiles, deleteFile } from '../service/api';
import type { FileUpload } from '../service/types';

export function DocsPage(): JSX.Element {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  useEffect(() => {
    loadFiles();
  }, [selectedFolder]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const params = selectedFolder === 'all' ? {} : { folder: selectedFolder };
      const fileData = await getFiles(params);
      setFiles(fileData);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (selectedFiles: FileList) => {
    if (!selectedFiles.length) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(selectedFiles)) {
        await uploadFile(file, file.name);
      }
      loadFiles();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await deleteFile(fileId);
      loadFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const filteredFiles = files;

  return (
    <div className="space-y-6 pb-20 lg:pb-0 p-4">
      <PageHeader title="Documents" icon={<File className="w-6 h-6" />} />
      
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Files</option>
            <option value="documents">Documents</option>
            <option value="images">Images</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Upload Files
        </button>
      </div>

      {/* Files Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <EmptyCard text="No files uploaded yet. Upload your first document to get started." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDelete={() => handleDeleteFile(file.id)}
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
        />
      )}
    </div>
  );
}

function FileCard({ file, onDelete }: {
  file: FileUpload;
  onDelete: () => void;
}) {
  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
      {file.content_type.startsWith('image/') ? (
        <img
          src={file.public_url}
          alt={file.original_filename}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      ) : (
        <div className="w-full h-32 flex items-center justify-center bg-gray-50 rounded-lg mb-3">
          {getFileIcon(file.content_type)}
        </div>
      )}
      
      <div className="space-y-1">
        <p className="font-medium text-sm text-gray-900 truncate" title={file.original_filename}>
          {file.original_filename}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(file.size)}
        </p>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <a
          href={file.public_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
        >
          <Eye className="w-3 h-3" />
        </a>
        <a
          href={file.public_url}
          download={file.original_filename}
          className="p-1 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
        >
          <Download className="w-3 h-3" />
        </a>
        <button
          onClick={onDelete}
          className="p-1 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
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
          <h2 className="text-xl font-bold text-gray-900">Upload Files</h2>
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
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Drag and drop files here, or</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
          >
            click to browse
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Supports images, documents, and other file types (max 10MB)
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => e.target.files && onUpload(e.target.files)}
          className="hidden"
        />

        {isUploading && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Uploading...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCard({ text }: { text: string }): JSX.Element {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
      {text}
    </div>
  );
}