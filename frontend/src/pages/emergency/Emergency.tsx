import { AlertOctagon } from 'lucide-react';

export default function EmergencyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 text-red-500">
        <AlertOctagon className="w-8 h-8" />
        <h2 className="text-2xl font-bold tracking-tight">Emergency Protocol Mode</h2>
      </div>
      <div className="border border-red-500/50 bg-red-500/10 p-6 rounded-xl">
        <h3 className="text-xl font-bold text-red-400 mb-2">Emergency Override System</h3>
        <p className="text-red-200/80 mb-6 max-w-2xl">
          Activating Emergency Mode will recalculate all active routes to prioritize medical and rescue vehicles. Commercial and non-essential logistics will be deprioritized or halted.
        </p>
        <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.5)] transition hover:scale-105">
          Activate Emergency Mode
        </button>
      </div>
    </div>
  );
}
