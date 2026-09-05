import React, { useState, useRef } from 'react';
import { UploadCloud, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { predictionsApi } from '../services/predictionsApi';
import { useAppStore } from '../store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DatasetUploadModal({ isOpen, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [metrics, setMetrics] = useState<{ eta_mae?: number; disruption_accuracy?: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setStatus('idle');
    setMessage('Uploading dataset and training models... This may take a minute.');
    setMetrics(null);
    
    try {
      const response = await predictionsApi.uploadDataset(file);
      
      setStatus('success');
      setMessage(response.message || 'Models successfully trained and vehicles inserted from CSV.');
      setMetrics(response.metrics);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to process dataset. Please check the schema.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-purple-400" />
            Upload Training Dataset
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-gray-400 mb-6">
            Upload a CSV file containing historical logistics data. The XGBoost models will dynamically retrain and deploy automatically.
          </p>

          <div 
            className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition cursor-pointer mb-6"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
            />
            <UploadCloud className={`w-12 h-12 mb-3 ${file ? 'text-purple-400' : 'text-gray-500'}`} />
            {file ? (
              <p className="text-white font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-white font-medium">Drag & drop your CSV file here</p>
                <p className="text-xs text-gray-400 mt-1">or click to browse</p>
              </>
            )}
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg flex items-start gap-3 mb-6 ${status === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : status === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'}`}>
              {status === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
              {status === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
              {status === 'idle' && isUploading && <Loader className="w-5 h-5 shrink-0 animate-spin" />}
              <div className="text-sm">{message}</div>
            </div>
          )}

          {/* Metrics */}
          {metrics && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/50 border border-white/10 p-3 rounded-lg">
                <p className="text-[10px] text-gray-400 font-bold tracking-widest mb-1">ETA MODEL MAE</p>
                <p className="text-xl font-bold text-white">{metrics.eta_mae?.toFixed(2)} min</p>
              </div>
              <div className="bg-black/50 border border-white/10 p-3 rounded-lg">
                <p className="text-[10px] text-gray-400 font-bold tracking-widest mb-1">DISRUPTION ACCURACY</p>
                <p className="text-xl font-bold text-white">{(metrics.disruption_accuracy! * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? 'Training...' : 'Upload & Train'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
