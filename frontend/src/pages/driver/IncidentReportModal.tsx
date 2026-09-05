import React, { useState } from 'react';
import { X, AlertTriangle, Send, MapPin } from 'lucide-react';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { incident_type: string; severity: string; description: string }) => void;
  currentLat: number;
  currentLng: number;
}

export default function IncidentReportModal({ isOpen, onClose, onSubmit, currentLat, currentLng }: IncidentReportModalProps) {
  const [type, setType] = useState('LANDSLIDE');
  const [severity, setSeverity] = useState('MODERATE');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ incident_type: type, severity, description });
      // Reset form
      setType('LANDSLIDE');
      setSeverity('MODERATE');
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-zinc-800/50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Report Incident
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Incident Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="LANDSLIDE">Landslide</option>
              <option value="FLOOD">Flood</option>
              <option value="ROAD_DAMAGE">Road Blockage / Damage</option>
              <option value="TRAFFIC">Accident / Heavy Traffic</option>
              <option value="WEATHER">Severe Weather</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Severity / Risk Level</label>
            <select 
              value={severity} 
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="LOW">Low</option>
              <option value="MODERATE">Moderate</option>
              <option value="ELEVATED">Elevated</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Description (Optional)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the incident..."
              rows={3}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="bg-black/30 rounded-lg p-3 flex items-start gap-2 border border-white/5">
            <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-sm text-zinc-400">
              <span className="text-zinc-300 font-medium block">Current Location Attached</span>
              {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-4 ${
              isSubmitting 
                ? 'bg-amber-600/50 text-white/70 cursor-not-allowed' 
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                PROCESSING...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                SUBMIT REPORT
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
