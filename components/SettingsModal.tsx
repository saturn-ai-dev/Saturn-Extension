import React, { useRef, useState } from 'react';
import { X, Shield, Globe, PaintBucket, Droplet, Sun, Upload, Image as ImageIcon, Smartphone, Box, Rocket, Sparkles, Download, FileText, Video, Puzzle, Trash2, Plus, User, Link, Monitor, Key, ExternalLink, Check, FileUp, FileDown, Loader2 } from 'lucide-react';
import { Theme, DownloadItem, UserProfile, Extension, CustomShortcut, Tab } from '../types';
import { exportConversations, importConversations } from '../services/conversationService';
import { generateOptimizedSystemInstructions } from '../services/geminiService';


interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
    setTheme: (t: Theme) => void;
    isIncognito: boolean;
    toggleIncognito: () => void;
    customBackdrop: string | null;
    setCustomBackdrop: (url: string | null) => void;
    enabledSidebarApps: string[];
    toggleSidebarApp: (appId: string) => void;

    // New Data Props
    currentUser: UserProfile;
    users: UserProfile[];
    onSwitchUser: (id: string) => void;
    onAddUser: (name: string) => void;
    downloads: DownloadItem[];
    availableExtensions: Extension[];
    onToggleExtension: (id: string) => void;
    onCreateExtension: (ext: Extension) => void;
    onDeleteExtension: (id: string) => void;

    // Shortcuts
    onAddCustomShortcut: (s: CustomShortcut) => void;
    onDeleteCustomShortcut: (id: string) => void;

    // Model
    onSetModel: (model: string) => void;
    onSetImageModel: (model: string) => void;
    onResetLayout: () => void;
    onUpdateSidebarSetting: (key: keyof UserProfile, value: any) => void;

    // Data
    tabs: Tab[];
    setTabs: (tabs: Tab[]) => void;
    archivedTabs: Tab[];
    setArchivedTabs: (tabs: Tab[]) => void;
    customInstructions: string;
    setCustomInstructions: (instructions: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, theme, setTheme, isIncognito, toggleIncognito,
    customBackdrop, setCustomBackdrop, enabledSidebarApps, toggleSidebarApp,
    currentUser, users, onSwitchUser, onAddUser, downloads, availableExtensions,
    onToggleExtension, onCreateExtension, onDeleteExtension,
    onAddCustomShortcut, onDeleteCustomShortcut, onSetModel, onSetImageModel,
    onResetLayout, onUpdateSidebarSetting,
    tabs, setTabs, archivedTabs, setArchivedTabs, customInstructions, setCustomInstructions
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'personas' | 'instructions' | 'user'>('general');

    // Optimization Wizard State
    const [optimizationStep, setOptimizationStep] = useState(-1);
    const [optimizationAnswers, setOptimizationAnswers] = useState<string[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isOptimizing, setIsOptimizing] = useState(false);

    const optimizationQuestions = [
        "What tone should the AI use? (e.g. Professional, Friendly, Pirate)",
        "How detailed should responses be? (e.g. Concise, Comprehensive)",
        "Any specific formatting preferences? (e.g. Markdown, Bullet points)",
        "What is your role or goal? (e.g. Student, Developer, Casual browsing)"
    ];

    const handleOptimizationNext = async () => {
        const newAnswers = [...optimizationAnswers, currentAnswer];
        if (optimizationStep < optimizationQuestions.length - 1) {
            setOptimizationAnswers(newAnswers);
            setCurrentAnswer('');
            setOptimizationStep(prev => prev + 1);
        } else {
            // Finish
            setIsOptimizing(true);
            try {
                const optimized = await generateOptimizedSystemInstructions(newAnswers);
                setCustomInstructions(optimized);
            } catch (e) {
                console.error("Optimization failed", e);
                alert("Failed to generate instructions. Please try again or check your API key.");
            } finally {
                setIsOptimizing(false);
                setOptimizationStep(-1);
                setOptimizationAnswers([]);
                setCurrentAnswer('');
            }
        }
    };

    // API Key State
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
    const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('openai_api_key') || '');

    // State for creating extension
    const [isCreatingExt, setIsCreatingExt] = useState(false);
    const [newExtName, setNewExtName] = useState('');
    const [newExtIcon, setNewExtIcon] = useState('🧩');
    const [newExtDesc, setNewExtDesc] = useState('');
    const [newExtInstruct, setNewExtInstruct] = useState('');

    // State for adding user
    const [newUserName, setNewUserName] = useState('');
    const [isAddingUser, setIsAddingUser] = useState(false);

    // State for adding shortcut
    const [newShortcutLabel, setNewShortcutLabel] = useState('');
    const [newShortcutUrl, setNewShortcutUrl] = useState('');
    const [newShortcutEmoji, setNewShortcutEmoji] = useState('🔗');
    const [isAddingShortcut, setIsAddingShortcut] = useState(false);

    if (!isOpen) return null;

    const handleSaveKey = (val: string) => {
        setApiKey(val);
        localStorage.setItem('gemini_api_key', val);
    };

    const handleSaveOpenAIKey = (val: string) => {
        setOpenaiKey(val);
        localStorage.setItem('openai_api_key', val);
        onUpdateSidebarSetting('openaiApiKey', val);
    };

    const handleBackdropUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomBackdrop(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateExtensionSubmit = () => {
        if (newExtName.trim() && newExtInstruct.trim()) {
            const newExt: Extension = {
                id: `ext-${Date.now()}`,
                name: newExtName.trim(),
                icon: newExtIcon.trim() || '🎭',
                description: newExtDesc.trim() || 'Custom persona',
                instruction: newExtInstruct.trim()
            };
            onCreateExtension(newExt);
            setNewExtName(''); setNewExtIcon('🎭'); setNewExtDesc(''); setNewExtInstruct('');
            setIsCreatingExt(false);
        }
    };

    const handleAddUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUserName.trim()) {
            onAddUser(newUserName.trim());
            setNewUserName('');
            setIsAddingUser(false);
        }
    };

    const handleAddShortcutSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newShortcutLabel.trim() && newShortcutUrl.trim()) {
            let url = newShortcutUrl.trim();
            if (!url.startsWith('http')) url = 'https://' + url;

            const shortcut: CustomShortcut = {
                id: `sc-${Date.now()}`,
                label: newShortcutLabel.trim(),
                url: url,
                emoji: newShortcutEmoji || '🔗'
            };
            onAddCustomShortcut(shortcut);
            setNewShortcutLabel(''); setNewShortcutUrl('');
            setIsAddingShortcut(false);
        }
    };

    const sidebarAppsList = [
        { id: 'notes', label: 'Notes' },
        { id: 'calculator', label: 'Calculator' },
        { id: 'spotify', label: 'Spotify' },
        { id: 'twitch', label: 'Twitch' },
        { id: 'whatsapp', label: 'WhatsApp' },
        { id: 'reddit', label: 'Reddit' },
        { id: 'x', label: 'X' },
        { id: 'youtube', label: 'YouTube' },
    ];

    const getDownloadIcon = (type: string) => {
        switch (type) {
            case 'image': return <ImageIcon className="w-4 h-4 text-purple-400" />;
            case 'video': return <Video className="w-4 h-4 text-pink-400" />;
            default: return <FileText className="w-4 h-4 text-blue-400" />;
        }
    };

    // Determine appropriate text color for active tabs based on theme
    const getActiveTextColor = () => {
        if (theme === 'blackbox' || theme === 'glass' || theme === 'galaxy') {
            return 'text-zen-bg'; // Dark text for light/bright accents
        }
        return 'text-white'; // White text for standard/dark accents
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zen-bg w-full max-w-4xl h-[80vh] rounded-3xl border border-zen-border shadow-deep flex overflow-hidden scale-100 animate-scale-in">

                {/* Sidebar */}
                <div className="w-64 border-r border-zen-border bg-zen-surface/30 flex flex-col p-4">
                    <div className="text-2xl font-bold text-zen-text mb-8 px-2 flex items-center gap-2">
                        <Rocket className="w-6 h-6 text-zen-accent" />
                        Saturn
                    </div>
                    <nav className="flex-1 space-y-1">
                        {[
                            { id: 'general', label: 'General', icon: <Box className="w-4 h-4" /> },
                            { id: 'personas', label: 'Personas', icon: <User className="w-4 h-4" /> },
                            { id: 'instructions', label: 'Custom Instructions', icon: <FileText className="w-4 h-4" /> },
                            { id: 'user', label: 'Profile', icon: <User className="w-4 h-4" /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? `bg-zen-accent shadow-lg ${getActiveTextColor()}` : 'text-zen-muted hover:text-zen-text hover:bg-zen-surface'}`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                    <div className="mt-auto pt-4 border-t border-zen-border/30">
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${currentUser.avatarColor}`}>
                                {currentUser.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-zen-text truncate">{currentUser.name}</div>
                                <div className="text-[10px] text-zen-muted">Active Session</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center justify-between p-6 border-b border-zen-border">
                        <h2 className="text-xl font-bold text-zen-text capitalize">{activeTab} Settings</h2>
                        <button onClick={onClose} className="p-2 hover:bg-zen-surface rounded-full text-zen-muted hover:text-zen-text transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">

                        {/* TAB: GENERAL */}
                        {activeTab === 'general' && (
                            <div className="space-y-10 max-w-2xl">

                                {/* API Key Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-zen-muted uppercase tracking-widest mb-5 pl-1">Connection</h3>
                                    <div className="space-y-4">
                                        <div className="p-5 rounded-2xl bg-zen-surface border border-zen-border/50 shadow-sm">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-500"><Key className="w-5 h-5" /></div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-zen-text">Gemini API Key</div>
                                                    <div className="text-xs text-zen-muted">Required for Gemini features</div>
                                                </div>
                                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs font-bold text-zen-accent hover:underline flex items-center gap-1">
                                                    Get Key <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                            <input
                                                type="password"
                                                value={apiKey}
                                                onChange={(e) => handleSaveKey(e.target.value)}
                                                placeholder="Paste your Gemini API key here..."
                                                className="w-full bg-zen-bg border border-zen-border rounded-xl px-4 py-3 outline-none focus:border-zen-accent text-sm font-mono text-zen-text placeholder-zen-muted/50"
                                            />
                                        </div>

                                        <div className="p-5 rounded-2xl bg-zen-surface border border-zen-border/50 shadow-sm">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="p-3 rounded-xl bg-green-500/10 text-green-500"><Key className="w-5 h-5" /></div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-zen-text">OpenAI API Key</div>
                                                    <div className="text-xs text-zen-muted">Required for OpenAI features</div>
                                                </div>
                                                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-xs font-bold text-zen-accent hover:underline flex items-center gap-1">
                                                    Get Key <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                            <input
                                                type="password"
                                                value={openaiKey}
                                                onChange={(e) => handleSaveOpenAIKey(e.target.value)}
                                                placeholder="Paste your OpenAI API key here..."
                                                className="w-full bg-zen-bg border border-zen-border rounded-xl px-4 py-3 outline-none focus:border-zen-accent text-sm font-mono text-zen-text placeholder-zen-muted/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Model Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-zen-muted uppercase tracking-widest mb-5 pl-1">Intelligence</h3>
                                    <div className="p-5 rounded-2xl bg-zen-surface border border-zen-border/50 shadow-sm">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400"><Sparkles className="w-5 h-5" /></div>
                                            <div>
                                                <div className="text-sm font-bold text-zen-text">AI Model</div>
                                                <div className="text-xs text-zen-muted">Select the brain power for Saturn</div>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-2 text-[10px] font-bold text-zen-muted uppercase tracking-wider">Gemini Models</div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                            {[
                                                { id: 'gemini-flash-latest', name: 'Gemini 2.5 Flash', desc: 'Latest Fast Model' },
                                                { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Next-Gen High Speed' },
                                                { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Advanced Reasoning' },
                                                { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', desc: 'Next-Gen Preview' },
                                            ].map(model => (
                                                <button
                                                    key={model.id}
                                                    onClick={() => onSetModel(model.id)}
                                                    className={`p-3 rounded-xl border text-left transition-all ${currentUser.preferredModel === model.id || (!currentUser.preferredModel && model.id === 'gemini-flash-latest') ? 'bg-zen-bg border-zen-accent shadow-md' : 'bg-zen-bg/50 border-zen-border hover:bg-zen-bg'}`}
                                                >
                                                    <div className="text-sm font-bold text-zen-text">{model.name}</div>
                                                    <div className="text-xs text-zen-muted">{model.desc}</div>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mb-2 text-[10px] font-bold text-zen-muted uppercase tracking-wider">OpenAI Models</div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                            {[
                                                { id: 'gpt-5.2', name: 'GPT-5.2', desc: 'Latest Flagship' },
                                                { id: 'gpt-5-mini', name: 'GPT-5 Mini', desc: 'Fast & Efficient' },
                                                { id: 'gpt-4o-2024-11-20', name: 'GPT-4o', desc: 'Legacy Reliable' },
                                            ].map(model => (
                                                <button
                                                    key={model.id}
                                                    onClick={() => onSetModel(model.id)}
                                                    className={`p-3 rounded-xl border text-left transition-all ${currentUser.preferredModel === model.id ? 'bg-zen-bg border-green-500 shadow-md' : 'bg-zen-bg/50 border-zen-border hover:bg-zen-bg'}`}
                                                >
                                                    <div className="text-sm font-bold text-zen-text">{model.name}</div>
                                                    <div className="text-xs text-zen-muted">{model.desc}</div>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Layout Settings */}
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-zen-bg/30 border border-zen-border/50 mb-4">
                                            <div>
                                                <div className="text-sm font-bold text-zen-text">Reset Layout</div>
                                                <div className="text-xs text-zen-muted">Restore sidebar width and defaults</div>
                                            </div>
                                            <button onClick={() => { onResetLayout(); }} className="px-3 py-1.5 bg-zen-surface hover:bg-zen-bg border border-zen-border rounded-lg text-xs font-bold transition-colors text-zen-text">
                                                Reset
                                            </button>
                                        </div>

                                        {/* Auto Rename Setting */}
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-zen-bg/30 border border-zen-border/50 mb-4">
                                            <div>
                                                <div className="text-sm font-bold text-zen-text">Auto-rename Chats</div>
                                                <div className="text-xs text-zen-muted">Automatically name new threads using Gemini</div>
                                            </div>
                                            <button 
                                                onClick={() => onUpdateSidebarSetting('autoRenameChats', !currentUser.autoRenameChats)}
                                                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${currentUser.autoRenameChats !== false ? 'bg-zen-accent' : 'bg-zen-border'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${currentUser.autoRenameChats !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        {/* Image Generation */}
                                        <div className="flex items-center gap-4 mb-4 pt-4 border-t border-zen-border/50">
                                            <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400"><ImageIcon className="w-5 h-5" /></div>
                                            <div>
                                                <div className="text-sm font-bold text-zen-text">Image Generation</div>
                                                <div className="text-xs text-zen-muted">Select the creative engine</div>
                                            </div>
                                        </div>
                                        
                                        {currentUser.preferredModel?.startsWith('gpt') ? (
                                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-2">
                                                <div className="text-sm font-bold text-green-400">OpenAI Mode Active</div>
                                                <div className="text-xs text-green-400/80">
                                                    Image Model: chatgpt-image-latest<br/>
                                                    Video Model: sora-2-2025-10-06
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {[
                                                    { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', desc: 'Fast Generation' },
                                                    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3.0 Image', desc: 'High Fidelity Preview' },
                                                ].map(model => (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => onSetImageModel(model.id)}
                                                        className={`p-3 rounded-xl border text-left transition-all ${currentUser.preferredImageModel === model.id || (!currentUser.preferredImageModel && model.id === 'gemini-2.5-flash-image') ? 'bg-zen-bg border-zen-accent shadow-md' : 'bg-zen-bg/50 border-zen-border hover:bg-zen-bg'}`}
                                                    >
                                                        <div className="text-sm font-bold text-zen-text">{model.name}</div>
                                                        <div className="text-xs text-zen-muted">{model.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Theme Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-zen-muted uppercase tracking-widest mb-5 pl-1">Visuals</h3>
                                    <div className="p-5 rounded-2xl bg-zen-surface border border-zen-border/50 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400"><PaintBucket className="w-5 h-5" /></div>
                                                <div>
                                                    <div className="text-sm font-bold text-zen-text">Interface Theme</div>
                                                    <div className="text-xs text-zen-muted">Customize your workspace</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 flex-wrap">
                                            {[
                                                { id: 'red', color: 'bg-red-600' }, { id: 'blue', color: 'bg-blue-600' },
                                                { id: 'charcoal-cosmic', color: 'bg-orange-500' }, { id: 'galaxy', color: 'bg-fuchsia-600' },
                                                { id: 'blackbox', color: 'bg-black' }, { id: 'glass', color: 'bg-cyan-500' },
                                                { id: 'light', color: 'bg-gray-100', border: 'border-gray-300' }
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setTheme(t.id as Theme)}
                                                    className={`w-10 h-10 rounded-full border-2 transition-all shadow-lg ${t.color} ${t.border || 'border-transparent'} ${theme === t.id ? 'scale-110 border-white' : 'opacity-60 hover:opacity-100'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Customization */}
                                <div>
                                    <h3 className="text-xs font-bold text-zen-muted uppercase tracking-widest mb-5 pl-1">Sidebar Customization</h3>
                                    <div className="p-5 rounded-2xl bg-zen-surface border border-zen-border/50 shadow-sm space-y-6">
                                        
                                        {/* Position */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-bold text-zen-text">Sidebar Position</div>
                                                <div className="text-xs text-zen-muted">Choose which side the bar appears on</div>
                                            </div>
                                            <div className="flex bg-zen-bg p-1 rounded-xl border border-zen-border">
                                                <button 
                                                    onClick={() => onUpdateSidebarSetting('sidebarPosition', 'left')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentUser.sidebarPosition !== 'right' ? `bg-zen-accent shadow-md ${getActiveTextColor()}` : 'text-zen-muted hover:text-zen-text'}`}
                                                >
                                                    Left
                                                </button>
                                                <button 
                                                    onClick={() => onUpdateSidebarSetting('sidebarPosition', 'right')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentUser.sidebarPosition === 'right' ? `bg-zen-accent shadow-md ${getActiveTextColor()}` : 'text-zen-muted hover:text-zen-text'}`}
                                                >
                                                    Right
                                                </button>
                                            </div>
                                        </div>

                                        {/* Auto Hide */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-bold text-zen-text">Auto-Collapse</div>
                                                <div className="text-xs text-zen-muted">Collapse sidebar when not in use</div>
                                            </div>
                                            <button 
                                                onClick={() => onUpdateSidebarSetting('sidebarAutoHide', !currentUser.sidebarAutoHide)}
                                                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${currentUser.sidebarAutoHide ? 'bg-zen-accent' : 'bg-zen-border'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${currentUser.sidebarAutoHide ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        {/* Show Status */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-bold text-zen-text">Show Profile Status</div>
                                                <div className="text-xs text-zen-muted">Display user card at bottom</div>
                                            </div>
                                            <button 
                                                onClick={() => onUpdateSidebarSetting('sidebarShowStatus', currentUser.sidebarShowStatus === false)}
                                                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${currentUser.sidebarShowStatus !== false ? 'bg-zen-accent' : 'bg-zen-border'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${currentUser.sidebarShowStatus !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        {/* Glass Intensity */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm font-bold text-zen-text">Glass Intensity</div>
                                                <span className="text-xs font-mono text-zen-accent">{currentUser.sidebarGlassIntensity || 70}px</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={currentUser.sidebarGlassIntensity || 70} 
                                                onChange={(e) => onUpdateSidebarSetting('sidebarGlassIntensity', parseInt(e.target.value))}
                                                className="w-full accent-zen-accent h-1.5 bg-zen-border rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Apps */}
                                <div>
                                    <h3 className="text-xs font-bold text-zen-muted uppercase tracking-widest mb-5 pl-1">Sidebar Apps & Links</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        {sidebarAppsList.map(app => {
                                            const isEnabled = enabledSidebarApps.includes(app.id);
                                            return (
                                                <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl bg-zen-surface border border-zen-border/50 hover:border-zen-border transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 rounded-lg bg-zen-bg text-zen-text border border-zen-border/50"><Smartphone className="w-4 h-4" /></div>
                                                        <span className="text-sm font-bold text-zen-text">{app.label}</span>
                                                    </div>
                                                    <button onClick={() => toggleSidebarApp(app.id)} className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${isEnabled ? 'bg-zen-accent' : 'bg-zen-border'}`}>
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Custom Shortcuts */}
                                    <div className="bg-zen-surface border border-zen-border/50 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Link className="w-4 h-4" /></div>
                                                <span className="text-sm font-bold text-zen-text">Custom Shortcuts</span>
                                            </div>
                                            <button onClick={() => setIsAddingShortcut(!isAddingShortcut)} className="text-xs font-bold text-zen-accent hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                                        </div>

                                        {isAddingShortcut && (
                                            <form onSubmit={handleAddShortcutSubmit} className="mb-4 flex gap-2 items-center bg-zen-bg/50 p-2 rounded-xl border border-zen-border">
                                                <input className="w-10 bg-transparent border-b border-zen-border text-center outline-none" placeholder="🔗" value={newShortcutEmoji} onChange={e => setNewShortcutEmoji(e.target.value)} maxLength={2} />
                                                <input className="flex-1 bg-transparent border-b border-zen-border px-2 py-1 outline-none text-sm" placeholder="Name (e.g. GitHub)" value={newShortcutLabel} onChange={e => setNewShortcutLabel(e.target.value)} autoFocus />
                                                <input className="flex-[2] bg-transparent border-b border-zen-border px-2 py-1 outline-none text-sm" placeholder="URL (e.g. github.com)" value={newShortcutUrl} onChange={e => setNewShortcutUrl(e.target.value)} />
                                                <button type="submit" className="p-1.5 bg-zen-accent text-white rounded-lg"><Plus className="w-4 h-4" /></button>
                                            </form>
                                        )}

                                        <div className="space-y-2">
                                            {currentUser.customShortcuts?.map(sc => (
                                                <div key={sc.id} className="flex items-center justify-between p-3 bg-zen-bg/30 rounded-xl group">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{sc.emoji}</span>
                                                        <div>
                                                            <div className="text-sm font-bold">{sc.label}</div>
                                                            <div className="text-[10px] text-zen-muted">{sc.url}</div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => onDeleteCustomShortcut(sc.id)} className="text-zen-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                            {(!currentUser.customShortcuts || currentUser.customShortcuts.length === 0) && !isAddingShortcut && (
                                                <div className="text-center text-xs text-zen-muted py-2 italic">No custom shortcuts added.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Privacy */}
                                <div>
                                    <h3 className="text-xs font-bold text-zen-muted uppercase tracking-widest mb-5 pl-1">Privacy</h3>
                                    <div className="flex items-center justify-between p-5 rounded-2xl bg-zen-surface border border-zen-border/50 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-zinc-500/10 text-zinc-400"><Shield className="w-5 h-5" /></div>
                                            <div>
                                                <div className="text-sm font-bold text-zen-text">Incognito Mode</div>
                                                <div className="text-xs text-zen-muted">Disable history tracking</div>
                                            </div>
                                        </div>
                                        <button onClick={toggleIncognito} className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${isIncognito ? 'bg-zen-text' : 'bg-zen-border'}`}>
                                            <div className={`w-5 h-5 bg-zen-bg rounded-full shadow-md transition-transform ${isIncognito ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Data Management */}
                                <div>
                                    <h3 className="text-xs font-bold text-zen-muted uppercase tracking-widest mb-5 pl-1">Data Management</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const importedTabs = await importConversations();
                                                    if (importedTabs.length > 0) {
                                                        const [firstTab, ...restTabs] = importedTabs;
                                                        setTabs([firstTab]);
                                                        setArchivedTabs(restTabs);
                                                    }
                                                    onClose();
                                                    alert('Conversations imported successfully!');
                                                } catch (error) {
                                                    console.error(error);
                                                    alert((error as Error).message);
                                                }
                                            }}
                                            className="p-5 rounded-2xl bg-zen-surface border border-zen-border/50 shadow-sm hover:border-zen-accent transition-colors flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-green-500/10 text-green-400"><FileUp className="w-5 h-5" /></div>
                                            <div>
                                                <div className="text-sm font-bold text-zen-text">Import Conversations</div>
                                                <div className="text-xs text-zen-muted">Load from a .json file</div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => exportConversations([...tabs, ...archivedTabs])}
                                            className="p-5 rounded-2xl bg-zen-surface border border-zen-border/50 shadow-sm hover:border-zen-accent transition-colors flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400"><FileDown className="w-5 h-5" /></div>
                                            <div>
                                                <div className="text-sm font-bold text-zen-text">Export Conversations</div>
                                                <div className="text-xs text-zen-muted">Save to a .json file</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: PERSONAS */}
                        {activeTab === 'personas' && (
                            <div className="max-w-3xl">
                                {isCreatingExt ? (
                                    <div className="p-6 bg-zen-surface/50 rounded-2xl border border-zen-border space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-lg font-bold">Create Custom Persona</h3>
                                            <button onClick={() => setIsCreatingExt(false)}><X className="w-5 h-5 text-zen-muted hover:text-zen-text" /></button>
                                        </div>
                                        <div className="flex gap-3">
                                            <input className="w-16 bg-zen-bg border border-zen-border rounded-xl text-center text-2xl py-3 focus:border-zen-accent outline-none" placeholder="🎭" maxLength={2} value={newExtIcon} onChange={e => setNewExtIcon(e.target.value)} />
                                            <input className="flex-1 bg-zen-bg border border-zen-border rounded-xl px-4 py-3 focus:border-zen-accent outline-none text-zen-text" placeholder="Persona Name" value={newExtName} onChange={e => setNewExtName(e.target.value)} autoFocus />
                                        </div>
                                        <input className="w-full bg-zen-bg border border-zen-border rounded-xl px-4 py-3 focus:border-zen-accent outline-none text-zen-text text-sm" placeholder="Short Description" value={newExtDesc} onChange={e => setNewExtDesc(e.target.value)} />
                                        <textarea className="w-full h-32 bg-zen-bg border border-zen-border rounded-xl px-4 py-3 focus:border-zen-accent outline-none text-zen-text text-sm resize-none" placeholder="System instructions (e.g. 'You are a pirate...')" value={newExtInstruct} onChange={e => setNewExtInstruct(e.target.value)} />
                                        <button onClick={handleCreateExtensionSubmit} disabled={!newExtName || !newExtInstruct} className="w-full bg-zen-text text-zen-bg font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all">Save Persona</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <button onClick={() => setIsCreatingExt(true)} className="w-full py-4 border-2 border-dashed border-zen-border hover:border-zen-accent hover:bg-zen-surface rounded-2xl flex flex-col items-center justify-center gap-2 text-zen-muted hover:text-zen-text transition-all group">
                                            <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                            <span className="font-bold text-sm">Create / Import Persona</span>
                                        </button>

                                        {availableExtensions.map(ext => {
                                            const isEnabled = currentUser.enabledExtensions?.includes(ext.id);
                                            return (
                                                <div key={ext.id} className="flex items-center gap-4 p-4 bg-zen-surface/40 border border-zen-border/50 rounded-2xl hover:border-zen-accent/50 transition-colors group">
                                                    <div className="w-12 h-12 rounded-xl bg-zen-bg border border-zen-border flex items-center justify-center text-2xl shadow-sm">{ext.icon}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-base font-bold text-zen-text">{ext.name}</div>
                                                        <div className="text-xs text-zen-muted truncate">{ext.description}</div>
                                                    </div>
                                                    <button onClick={() => onDeleteExtension(ext.id)} className="p-2 text-zen-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                                    <button onClick={() => onToggleExtension(ext.id)} className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${isEnabled ? 'bg-zen-accent' : 'bg-zen-border'}`}>
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: CUSTOM INSTRUCTIONS */}
                        {activeTab === 'instructions' && (
                            <div className="max-w-3xl h-full flex flex-col">
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-zen-text mb-2">Custom Instructions</h3>
                                    <p className="text-sm text-zen-muted">These instructions will be applied to every chat, regardless of the selected persona.</p>
                                </div>

                                {optimizationStep >= 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zen-surface/30 rounded-2xl border border-zen-border animate-fade-in">
                                        <div className="w-full max-w-md space-y-6">
                                            <div className="flex items-center justify-between text-xs font-bold text-zen-muted uppercase tracking-widest">
                                                <span>Step {optimizationStep + 1} of {optimizationQuestions.length}</span>
                                                <button onClick={() => setOptimizationStep(-1)} className="hover:text-zen-text"><X className="w-4 h-4" /></button>
                                            </div>

                                            <h4 className="text-xl font-bold text-zen-text text-center">{optimizationQuestions[optimizationStep]}</h4>

                                            <input
                                                autoFocus
                                                value={currentAnswer}
                                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleOptimizationNext()}
                                                className="w-full bg-zen-bg border-b-2 border-zen-border focus:border-zen-accent outline-none py-3 text-lg text-center text-zen-text placeholder-zen-muted/30 transition-colors"
                                                placeholder="Type your answer..."
                                            />

                                            <div className="flex justify-center pt-4">
                                                <button
                                                    onClick={handleOptimizationNext}
                                                    disabled={isOptimizing}
                                                    className="px-8 py-3 bg-zen-accent text-white rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-glow-lg disabled:opacity-70 disabled:scale-100 flex items-center gap-2"
                                                >
                                                    {isOptimizing && <Loader2 className="w-4 h-4 animate-spin" />}
                                                    {optimizationStep === optimizationQuestions.length - 1 ? (isOptimizing ? 'Generating...' : 'Finish') : 'Next'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col gap-4">
                                        <textarea
                                            value={customInstructions}
                                            onChange={(e) => setCustomInstructions(e.target.value)}
                                            placeholder="e.g., 'Always be concise', 'Use metric units', 'Talk like a pirate'..."
                                            className="flex-1 w-full bg-zen-bg border border-zen-border rounded-2xl p-6 outline-none focus:border-zen-accent text-zen-text text-base resize-none leading-relaxed"
                                        />

                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => {
                                                    setOptimizationStep(0);
                                                    setOptimizationAnswers([]);
                                                    setCurrentAnswer('');
                                                }}
                                                className="px-6 py-3 bg-zen-surface border border-zen-border rounded-xl text-zen-text font-bold hover:bg-zen-bg hover:border-zen-accent transition-all flex items-center gap-2"
                                            >
                                                <Sparkles className="w-4 h-4 text-purple-400" />
                                                Optimize with AI
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: USERS */}
                        {activeTab === 'user' && (
                            <div className="max-w-2xl space-y-6">
                                <div className="flex items-center gap-4 p-6 bg-zen-surface rounded-2xl border border-zen-border">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ${currentUser.avatarColor}`}>
                                        {currentUser.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-zen-text">{currentUser.name}</div>
                                        <div className="text-sm text-zen-muted">Active User</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-zen-muted uppercase tracking-widest pl-1">Switch Profile</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {users.map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => onSwitchUser(u.id)}
                                                className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${currentUser.id === u.id ? 'bg-zen-surface border-zen-accent shadow-lg scale-[1.02]' : 'bg-zen-surface/40 border-zen-border hover:bg-zen-surface hover:border-zen-border/80'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${u.avatarColor}`}>
                                                    {u.name.substring(0, 1)}
                                                </div>
                                                <div className="text-left">
                                                    <div className={`text-sm font-bold ${currentUser.id === u.id ? 'text-zen-text' : 'text-zen-muted'}`}>{u.name}</div>
                                                </div>
                                                {currentUser.id === u.id && <div className="ml-auto text-zen-accent"><Check className="w-5 h-5" /></div>}
                                            </button>
                                        ))}

                                        {isAddingUser ? (
                                            <form onSubmit={handleAddUserSubmit} className="p-4 rounded-xl border border-zen-accent bg-zen-surface flex flex-col gap-3">
                                                <input
                                                    className="w-full bg-zen-bg border border-zen-border rounded-lg px-3 py-2 text-sm text-zen-text outline-none focus:border-zen-accent"
                                                    placeholder="Profile Name"
                                                    value={newUserName}
                                                    onChange={e => setNewUserName(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button type="submit" className="flex-1 bg-zen-accent text-white rounded-lg py-1.5 text-xs font-bold">Create</button>
                                                    <button type="button" onClick={() => setIsAddingUser(false)} className="flex-1 bg-zen-bg text-zen-muted hover:text-zen-text border border-zen-border rounded-lg py-1.5 text-xs font-bold">Cancel</button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button onClick={() => setIsAddingUser(true)} className="p-4 rounded-xl border border-dashed border-zen-border hover:border-zen-accent hover:bg-zen-surface flex items-center justify-center gap-2 text-zen-muted hover:text-zen-text transition-all">
                                                <Plus className="w-5 h-5" />
                                                <span className="font-bold text-sm">Add Profile</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Custom Backdrop */}
                                <div className="pt-6 border-t border-zen-border/50">
                                    <h3 className="text-xs font-bold text-zen-muted uppercase tracking-widest mb-4 pl-1">Wallpaper</h3>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-32 h-20 rounded-xl bg-zen-bg border border-zen-border overflow-hidden relative group">
                                            {customBackdrop ? (
                                                <img src={customBackdrop} className="w-full h-full object-cover" alt="Custom" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zen-muted text-xs">None</div>
                                            )}
                                            {customBackdrop && (
                                                <button onClick={() => setCustomBackdrop(null)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleBackdropUpload}
                                                className="hidden"
                                                accept="image/*"
                                            />
                                            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-zen-surface border border-zen-border rounded-lg text-sm font-bold text-zen-text hover:bg-zen-bg transition-colors flex items-center gap-2">
                                                <Upload className="w-4 h-4" />
                                                Upload Image
                                            </button>
                                            <p className="text-[10px] text-zen-muted mt-2">Recommended: 1920x1080 or larger.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div >
    );
};

export default SettingsModal;
