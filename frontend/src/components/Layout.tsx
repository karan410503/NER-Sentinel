import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAppStore } from '../store';

export default function Layout() {
  const { emergencyMode } = useAppStore();

  return (
    <div className={`flex h-screen text-white overflow-hidden font-sans transition-colors duration-500 ${
      emergencyMode ? 'bg-[#1a0505] shadow-[inset_0_0_150px_rgba(239,68,68,0.15)] border-2 border-red-500/50 animate-pulse' : 'bg-[#060b14]'
    }`}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>
      
      {/* Emergency Overlay Vignette */}
      {emergencyMode && (
        <div className="pointer-events-none fixed inset-0 z-50 shadow-[inset_0_0_100px_rgba(239,68,68,0.2)] mix-blend-overlay"></div>
      )}
    </div>
  );
}
