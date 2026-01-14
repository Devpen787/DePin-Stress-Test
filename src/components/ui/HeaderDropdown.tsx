import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface HeaderDropdownProps {
    label: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isActive?: boolean;
}

export const HeaderDropdown: React.FC<HeaderDropdownProps> = ({ label, icon, children, isActive = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${isOpen || isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                    : 'text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white'
                    }`}
            >
                {icon}
                <span>{label}</span>
                <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                    <div className="py-1">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

// Dropdown Item Component
interface DropdownItemProps {
    icon?: React.ReactNode;
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    description?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ icon, children, onClick, disabled = false, description }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-all ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-slate-800/50'
            }`}
    >
        {icon && <span className="text-slate-400 mt-0.5">{icon}</span>}
        <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-slate-200">{children}</div>
            {description && <div className="text-[9px] text-slate-500 mt-0.5">{description}</div>}
        </div>
    </button>
);

// Dropdown Toggle Component
interface DropdownToggleProps {
    icon?: React.ReactNode;
    children: React.ReactNode;
    checked: boolean;
    onChange: () => void;
    description?: string;
}

export const DropdownToggle: React.FC<DropdownToggleProps> = ({ icon, children, checked, onChange, description }) => (
    <button
        onClick={onChange}
        className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-800/50 transition-all"
    >
        {icon && <span className="text-slate-400 mt-0.5">{icon}</span>}
        <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-slate-200">{children}</div>
            {description && <div className="text-[9px] text-slate-500 mt-0.5">{description}</div>}
        </div>
        <div className={`w-8 h-4 rounded-full transition-colors relative ${checked ? 'bg-emerald-500' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
    </button>
);

// Dropdown Divider
export const DropdownDivider: React.FC = () => (
    <div className="my-1 border-t border-slate-800" />
);
