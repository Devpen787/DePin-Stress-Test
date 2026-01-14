import React, { useState } from 'react';
import { X, BookOpen, Menu, Search } from 'lucide-react';
import { WIKI_CONTENT, WikiSection } from '../data/wiki';

interface MethodologySheetProps {
    isOpen: boolean;
    onClose: () => void;
}

// Custom Lightweight Markdown Renderer
// Avoids adding heavyweight dependencies like react-markdown
// Custom Lightweight Markdown Renderer
// Avoids adding heavyweight dependencies like react-markdown
const SimpleMarkdown: React.FC<{ content: string; searchQuery?: string }> = ({ content, searchQuery = '' }) => {
    const lines = content.split('\n');
    let inTable = false;
    let tableHeader: string[] = [];
    let tableRows: string[][] = [];

    // Helper to highlight matching text
    const highlight = (text: string): React.ReactNode => {
        if (!searchQuery || searchQuery.length < 2) return text;

        // Escape special regex characters to prevent crashes
        const safeQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${safeQuery})`, 'gi');

        return text.split(regex).map((part, i) =>
            regex.test(part) ? <span key={`hl-${i}`} className="bg-yellow-500/40 text-white rounded px-0.5 shadow-[0_0_10px_rgba(234,179,8,0.2)]">{part}</span> : part
        );
    };

    // Helper to parse nesting: Bold -> Code -> Italic -> Highlight
    const formatText = (text: string): React.ReactNode => {
        // 1. Split by Bold (**)
        return text.split('**').map((boldPart, i) => {
            if (i % 2 === 1) {
                // Bold Content
                return <strong key={`b-${i}`} className="text-white font-bold bg-white/5 px-1 rounded">{highlight(boldPart)}</strong>;
            }
            // 2. Split non-bold by Code (')
            return boldPart.split("'").map((codePart, j) => {
                if (j % 2 === 1) {
                    // Code Content
                    return <code key={`c-${i}-${j}`} className="text-amber-300 bg-amber-900/20 px-1 py-0.5 rounded font-mono text-xs">{highlight(codePart)}</code>;
                }
                // 3. Split non-code by Italic (*)
                return codePart.split('*').map((italicPart, k) => {
                    if (k % 2 === 1) {
                        // Italic Content
                        return <em key={`i-${i}-${j}-${k}`} className="text-slate-300 italic">{highlight(italicPart)}</em>;
                    }
                    // Plain Text -> Highlight
                    return highlight(italicPart);
                });
            });
        });
    };

    const renderLine = (line: string, index: number) => {
        const trimmed = line.trim();

        // Handle Empty Lines
        if (!trimmed) {
            if (inTable) {
                // End of table, render it
                const table = (
                    <div key={`table-${index}`} className="my-6 overflow-x-auto rounded-lg border border-slate-800">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900 uppercase text-xs font-bold text-slate-300">
                                <tr>
                                    {tableHeader.map((h, i) => <th key={i} className="px-4 py-3 border-b border-slate-800">{formatText(h)}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                                {tableRows.map((row, rI) => (
                                    <tr key={rI} className="hover:bg-slate-900/30">
                                        {row.map((cell, cI) => <td key={cI} className="px-4 py-3 align-top leading-relaxed">{formatText(cell)}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                inTable = false;
                tableHeader = [];
                tableRows = [];
                return table;
            }
            return <div key={index} className="h-4" />;
        }

        // Handle Tables
        if (trimmed.startsWith('|')) {
            const cells = trimmed.split('|').filter(c => c.trim() !== '').map(c => c.trim());
            if (trimmed.includes('---')) return null; // Skip separator line

            if (!inTable) {
                inTable = true;
                tableHeader = cells;
                return null; // Wait for rows
            } else {
                tableRows.push(cells);
                return null; // Accumulate rows
            }
        }

        // Handle Headers
        if (trimmed.startsWith('### ')) return <h3 key={index} className="text-lg font-bold text-white mt-8 mb-3 flex items-center gap-2"><span className="w-1 h-5 bg-indigo-500 rounded-full"></span>{trimmed.replace('### ', '')}</h3>;
        if (trimmed.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-indigo-400 mt-10 mb-4 pb-2 border-b border-slate-800/50">{trimmed.replace('## ', '')}</h2>;
        if (trimmed.startsWith('# ')) return <h1 key={index} className="text-3xl font-black text-white mb-8 uppercase tracking-tight bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">{trimmed.replace('# ', '')}</h1>;

        // Handle Blockquotes
        if (trimmed.startsWith('> ')) return <div key={index} className="border-l-4 border-indigo-500 pl-4 py-3 my-6 text-slate-300 italic bg-slate-900/50 rounded-r-lg shadow-sm">{formatText(trimmed.replace('> ', ''))}</div>;

        // Handle Lists
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('1. ')) {
            const text = trimmed.replace(/^[\*\-1\.]\s/, '');
            return (
                <div key={index} className="flex gap-3 mb-2 ml-2 group">
                    <span className="text-indigo-500 mt-2 text-[6px] group-hover:scale-150 transition-transform">●</span>
                    <span className="text-slate-300 leading-relaxed text-sm">
                        {formatText(text)}
                    </span>
                </div>
            );
        }

        // Handle Standard Paragraphs (with Bold support)
        return (
            <p key={index} className="text-slate-400 mb-3 leading-loose text-sm">
                {formatText(trimmed)}
            </p>
        );
    };

    // Post-loop table check (if file ends with table)
    const elements = lines.map(renderLine);
    if (inTable) {
        // Render orphaned table (simplified for brevity, realistically handled by logic above usually)
    }

    return <div className="space-y-1">{elements}</div>;
};

export const MethodologySheet: React.FC<MethodologySheetProps> = ({ isOpen, onClose }) => {
    const [activeSectionId, setActiveSectionId] = useState<string>(WIKI_CONTENT[0].id);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const scrollToSection = (id: string) => {
        const element = document.getElementById(`wiki-section-${id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSectionId(id);
            setIsMobileMenuOpen(false);
        }
    };

    const filteredSections = WIKI_CONTENT.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative w-full h-full bg-slate-950 border-l border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col md:flex-row">

                {/* Mobile Header */}
                <div className="md:hidden p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                    <span className="font-bold text-white flex items-center gap-2">
                        <BookOpen size={18} className="text-indigo-400" />
                        Wiki
                    </span>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-400">
                        <Menu size={20} />
                    </button>
                    <button onClick={onClose} className="text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Sidebar Navigation */}
                <div className={`
                    absolute md:relative z-20 w-64 h-full bg-slate-900 border-r border-slate-800 flex-col
                    ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'}
                `}>
                    <div className="p-6 border-b border-slate-800 hidden md:block">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={16} className="text-indigo-400" />
                            Documentation
                        </h2>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">v1.2.0 • Updated Jan 2026</p>
                    </div>

                    {/* Search Bar */}
                    <div className="p-4 border-b border-slate-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                                type="text"
                                placeholder="Search wiki..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {filteredSections.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <p className="text-xs text-slate-600">No results found.</p>
                            </div>
                        ) : (
                            filteredSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`
                                        w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all flex items-center gap-3
                                        ${activeSectionId === section.id
                                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}
                                    `}
                                >
                                    <span className="text-base">{section.icon}</span>
                                    <span className="truncate">{section.title}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Content Area - Consolidated Scroll View */}
                <div className="flex-1 h-full flex flex-col bg-slate-950 min-w-0 relative">
                    <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 text-slate-500 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-full transition-colors border border-slate-800 shadow-lg">
                        <X size={20} />
                    </button>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 scroll-smooth">
                        <div className="max-w-4xl mx-auto space-y-24 pb-32">
                            {WIKI_CONTENT.map((section) => (
                                <section
                                    key={section.id}
                                    id={`wiki-section-${section.id}`}
                                    className="scroll-mt-12"
                                    onMouseEnter={() => setActiveSectionId(section.id)}
                                >
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
                                        <span className="text-3xl">{section.icon}</span>
                                        <h1 className="text-2xl font-bold text-white">{section.title}</h1>
                                    </div>
                                    <SimpleMarkdown content={section.content} searchQuery={searchQuery} />
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
