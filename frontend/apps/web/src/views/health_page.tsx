import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Upload,
  Search,
  Grid,
  List,
  Download,
  Trash2,
  Eye,
  File,
  Plus,
  X,
  FileText,
  TestTube,
  Shield,
  Stethoscope
} from 'lucide-react';
import { getFileTypeFromMime, formatFileSize } from '../service/firebase';
import { uploadFile, deleteFile } from '../service/api';
import { createItem, listItems } from '../service/api';

interface HealthDocument {
  id: number;
  title: string;
  content?: string;
  created_at: string;
  updated_at: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  healthCategory?: HealthCategory;
  person?: string;
}

type HealthCategory = 'report' | 'prescription' | 'insurance' | 'vaccination' | 'other';
type ViewMode = 'grid' | 'list';
type FilterType = 'all' | HealthCategory;

const HEALTH_CATEGORIES: { value: HealthCategory; label: string; icon: React.ElementType }[] = [
  { value: 'report', label: 'Lab Reports', icon: TestTube },
  { value: 'prescription', label: 'Prescriptions', icon: FileText },
  { value: 'insurance', label: 'Insurance', icon: Shield },
  { value: 'vaccination', label: 'Vaccinations', icon: Stethoscope },
  { value: 'other', label: 'Other', icon: File },
];

const PEOPLE = ['Maniraj', 'Thirushanthini', 'Sanjay', 'Parents'];

export function HealthPage(): JSX.Element {
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterPerson, setFilterPerson] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<HealthDocument | null>(null);
  
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await listItems({ kind: 'health', limit: 100 });
      console.log('Loaded health documents:', docs); // Debug log
      
      const processedDocs = docs.map((item: any) => {
        let content: any = {};
        try {
          content = item.content ? JSON.parse(item.content) : {};
        } catch (e) {
          console.warn('Failed to parse content for item:', item.id, e);
          content = {};
        }
        
        return {
          id: item.id,
          title: item.title,
          created_at: item.created_at,
          updated_at: item.updated_at,
          fileUrl: content.fileUrl || content.url,
          fileName: content.fileName || content.originalName,
          fileSize: content.fileSize || content.size,
          fileType: content.fileType || getFileTypeFromMime(content.mimeType),
          healthCategory: content.healthCategory || 'other',
          person: content.person || 'Unknown',
        };
      });
      
      console.log('Processed documents:', processedDocs); // Debug log
      setDocuments(processedDocs);
    } catch (error) {
      console.error('Failed to load health documents:', error);
    }
  };

  const handleFileUpload = async (files: FileList, category: HealthCategory, person: string) => {
    if (!files.length) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploadResult = await uploadFile(file, 'health');
        
        const docData = {
          kind: 'health' as const,
          title: file.name,
          content: JSON.stringify({
            fileUrl: uploadResult.url,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.size,
            fileType: getFileTypeFromMime(file.type),
            originalName: file.name,
            mimeType: file.type,
            healthCategory: category,
            person: person,
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

  const handleDeleteDocument = async (doc: HealthDocument) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

    try {
      if (doc.fileName) {
        await deleteFile(doc.fileName);
      }
      // await deleteItem(doc.id); // TODO: Implement in api.ts
      loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterType === 'all' || doc.healthCategory === filterType;
    const matchesPerson = filterPerson === 'all' || doc.person === filterPerson;
    return matchesSearch && matchesCategory && matchesPerson;
  });

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Health Records</h1>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Upload Record
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Categories</option>
            {HEALTH_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
          </select>
           <select
            value={filterPerson}
            onChange={(e) => setFilterPerson(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All People</option>
            {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500'}`}><Grid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-500'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Documents Grid/List */}
      <div className="flex-1 overflow-auto">
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Heart className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No health records found</p>
            <p className="text-sm text-gray-400">Upload your first health record to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredDocuments.map((doc) => <HealthDocumentCard key={doc.id} document={doc} onView={() => setSelectedDoc(doc)} onDelete={() => handleDeleteDocument(doc)} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => <HealthDocumentRow key={doc.id} document={doc} onView={() => setSelectedDoc(doc)} onDelete={() => handleDeleteDocument(doc)} />)}
          </div>
        )}
      </div>

      {showUploadModal && <UploadHealthModal onClose={() => setShowUploadModal(false)} onUpload={handleFileUpload} isUploading={isUploading} />}
      {selectedDoc && <HealthDocumentViewer document={selectedDoc} onClose={() => setSelectedDoc(null)} />}
    </div>
  );
}

function HealthDocumentCard({ document, onView, onDelete }: { document: HealthDocument; onView: () => void; onDelete: () => void; }) {
  const CategoryIcon = HEALTH_CATEGORIES.find(c => c.value === document.healthCategory)?.icon || File;

  return (
    <div className="group relative aspect-[3/4] bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      {document.fileType === 'image' && document.fileUrl ? (
        <img src={document.fileUrl} alt={document.title} className="w-full h-full object-cover rounded-lg" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
          <CategoryIcon className="w-10 h-10 text-red-500" />
          <p className="font-semibold text-sm mt-2">{document.person}</p>
          <p className="text-xs text-gray-600 mt-1 line-clamp-3">{document.title}</p>
        </div>
      )}
      
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); onView(); }} className="p-2 bg-white rounded-full hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 bg-white rounded-full hover:bg-gray-100"><Trash2 className="w-4 h-4 text-red-500" /></button>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg p-2">
        <p className="text-white text-xs truncate font-semibold">{document.title}</p>
        <p className="text-white/80 text-xs">{document.person}</p>
      </div>
    </div>
  );
}

function HealthDocumentRow({ document, onView, onDelete }: { document: HealthDocument; onView: () => void; onDelete: () => void; }) {
  const CategoryIcon = HEALTH_CATEGORIES.find(c => c.value === document.healthCategory)?.icon || File;
  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm cursor-pointer" onClick={onView}>
      <CategoryIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{document.title}</p>
        <p className="text-sm text-gray-500">
          {document.person} • {document.fileSize && formatFileSize(document.fileSize)} • {new Date(document.created_at).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={(e) => { e.stopPropagation(); onView(); }} className="p-2 text-gray-400 hover:text-gray-600"><Eye className="w-4 h-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function UploadHealthModal({ onClose, onUpload, isUploading }: { onClose: () => void; onUpload: (files: FileList, category: HealthCategory, person: string) => void; isUploading: boolean; }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<HealthCategory>('report');
  const [person, setPerson] = useState<string>(PEOPLE[0]);

  const handleUploadClick = () => {
     if(fileInputRef.current?.files) {
        onUpload(fileInputRef.current.files, category, person);
     }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md m-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Upload Health Record</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Person</label>
          <select value={person} onChange={e => setPerson(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as HealthCategory)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            {HEALTH_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input ref={fileInputRef} type="file" multiple className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
        </div>

        <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} disabled={isUploading} className="py-2 px-4 border border-gray-300 rounded-md">Cancel</button>
            <button onClick={handleUploadClick} disabled={isUploading} className="py-2 px-4 bg-red-600 text-white rounded-md">
                {isUploading ? 'Uploading...' : 'Upload'}
            </button>
        </div>

      </div>
    </div>
  );
}

function HealthDocumentViewer({ document: doc, onClose }: { document: HealthDocument; onClose: () => void; }) {
  const handleDownload = () => {
    if (doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
     <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold truncate">{doc.title}</h2>
          <div className="flex items-center gap-2">
            {doc.fileUrl && (
              <button 
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Download file"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {doc.fileType === 'image' && doc.fileUrl ? (
            <img src={doc.fileUrl} alt={doc.title} className="max-w-full max-h-full object-contain mx-auto" />
          ) : (
            <div className="text-center py-10">
              <File className="w-16 h-16 mx-auto text-gray-300" />
              <p className="mt-2 text-lg">No preview available</p>
              <p className="text-sm text-gray-500">Download the file to view.</p>
              {doc.fileUrl && (
                <button 
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Download File
                </button>
              )}
            </div>
          )}
        </div>
        {/* Document Info */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Person:</span> {doc.person}
            </div>
            <div>
              <span className="font-medium text-gray-700">Category:</span> {doc.healthCategory}
            </div>
            <div>
              <span className="font-medium text-gray-700">File Size:</span> {doc.fileSize ? formatFileSize(doc.fileSize) : 'Unknown'}
            </div>
            <div>
              <span className="font-medium text-gray-700">Uploaded:</span> {new Date(doc.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


