import React from 'react';
import { ArrowLeft, Moon, Smartphone, Monitor, Shield, Save } from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-y-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Settings
        </h1>
      </div>

      <div className="max-w-2xl w-full mx-auto space-y-8">
        {/* Appearance Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
            <Monitor size={14} /> Appearance
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-800 border-2 border-indigo-500 text-white transition-all">
              <Moon size={24} className="text-indigo-400" />
              <span className="text-xs font-bold">Dark Mode</span>
            </button>
            <button className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:bg-slate-800 transition-all opacity-50 cursor-not-allowed">
              <Smartphone size={24} />
              <span className="text-xs font-bold">Light Mode</span>
            </button>
             <button className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:bg-slate-800 transition-all opacity-50 cursor-not-allowed">
              <Monitor size={24} />
              <span className="text-xs font-bold">System</span>
            </button>
          </div>
        </section>

        {/* Data Preferences */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
            <Shield size={14} /> Data & Simulation
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-300">Auto-Save Sessions</span>
                <span className="text-[10px] text-slate-500">Automatically save simulation parameters to local storage</span>
              </div>
              <div className="w-10 h-5 bg-indigo-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 opacity-75">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-300">Developer Mode</span>
                <span className="text-[10px] text-slate-500">Enable advanced debug metrics and raw simulation logs</span>
              </div>
              <div className="w-10 h-5 bg-slate-700 rounded-full relative cursor-pointer">
                 <div className="absolute left-1 top-1 w-3 h-3 bg-slate-400 rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </section>

        <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
          <Save size={16} />
          Save Preferences
        </button>
        
        <div className="text-center text-[10px] text-slate-600 font-mono">
          DePIN Stress Test v1.2.0 • Build 2026.01.08
        </div>
      </div>
    </div>
  );
};
