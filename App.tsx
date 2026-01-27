import React, { useState, useEffect, useRef, useMemo } from 'react';
import SaturnDock from './components/SaturnDock';
import HistoryView from './components/HistoryView';
import SidebarPanel from './components/SidebarPanel';
import MessageBubble from './components/MessageBubble';
import OmniBar from './components/OmniBar';
import SettingsModal from './components/SettingsModal';
import BookmarksBar from './components/BookmarksBar'; // [NEW]
import { Tab, Message, Role, SearchMode, Attachment, Theme, DownloadItem, UserProfile, Extension, BrowserState, CustomShortcut, HistoryItem, Bookmark } from './types';
import { createNewTab, streamGeminiResponse, generateImage, generateVideo } from './services/geminiService';
import { X } from 'lucide-react';

const DEFAULT_USER: UserProfile = {
    id: 'default',
    name: 'Guest',
    theme: 'saturn',
    avatarColor: 'bg-blue-600',
    enabledExtensions: [],
    enabledSidebarApps: ['notes', 'calculator'],
    customShortcuts: [],
    preferredModel: 'gemini-flash-latest',
    preferredImageModel: 'gemini-2.5-flash-image'
};

const DEFAULT_BROWSER_STATE: BrowserState = {
    url: '',
    history: [],
    currentIndex: -1,
    isOpen: false,
    key: 0
};

const AVATAR_COLORS = ['bg-red-600', 'bg-blue-600', 'bg-green-600', 'bg-yellow-600', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600'];
const GALAXY_IMG = "https://images.unsplash.com/photo-1534796636912-3b95b3ab5980?q=80&w=2000";

function getInitialTab(): Tab {
    return {
        id: createNewTab(),
        title: 'New Thread',
        messages: [],
        createdAt: Date.now(),
        browserState: { ...DEFAULT_BROWSER_STATE }
    };
}

export default function App() {
    // --- User Management ---
    const [users, setUsers] = useState<UserProfile[]>(() => {
        try {
            const saved = localStorage.getItem('deepsearch_users');
            return saved ? JSON.parse(saved) : [DEFAULT_USER];
        } catch { return [DEFAULT_USER]; }
    });

    const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
        try {
            const savedId = localStorage.getItem('deepsearch_current_user_id');
            const savedUsers = localStorage.getItem('deepsearch_users');
            const parsedUsers = savedUsers ? JSON.parse(savedUsers) : [DEFAULT_USER];
            let user = parsedUsers.find((u: UserProfile) => u.id === savedId) || parsedUsers[0];
            if (!user.enabledExtensions) user.enabledExtensions = [];
            if (!user.customShortcuts) user.customShortcuts = [];
            return user;
        } catch { return DEFAULT_USER; }
    });

    const [customExtensions, setCustomExtensions] = useState<Extension[]>(() => {
        try {
            const saved = localStorage.getItem('deepsearch_custom_extensions');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const allExtensions = customExtensions;

    // --- Session State (Per User) ---
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string>('');
    const [archivedTabs, setArchivedTabs] = useState<Tab[]>([]);
    const [downloads, setDownloads] = useState<DownloadItem[]>([]);
    const [globalHistory, setGlobalHistory] = useState<HistoryItem[]>([]);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]); // [NEW]
    const [customInstructions, setCustomInstructions] = useState<string>('');

    // Sidebar State
    const [showHistory, setShowHistory] = useState(false);
    const [activeSidebarApp, setActiveSidebarApp] = useState<string | null>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [searchMode, setSearchMode] = useState<SearchMode>('normal');
    const [currentTheme, setCurrentTheme] = useState<Theme>(currentUser.theme);
    const [isIncognito, setIsIncognito] = useState(false);
    const [customBackdrop, setCustomBackdrop] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Persistence & User Switching ---
    useEffect(() => {
        const userId = currentUser.id;
        const storageKey = `deepsearch_data_${userId}`;

        try {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);

                // ARCHIVE OLD TABS: Move any previous active tabs to archive
                const previousTabs = data.tabs || [];
                const previousArchives = data.archivedTabs || [];
                // Filter out empty new tabs from archive to avoid clutter
                const validPreviousTabs = previousTabs.filter((t: Tab) => t.messages.length > 0);

                const newTab = getInitialTab();
                setTabs([newTab]);
                setActiveTabId(newTab.id);

                setArchivedTabs([...validPreviousTabs, ...previousArchives]);
                setDownloads(data.downloads || []);
                setGlobalHistory(data.globalHistory || []);
                setBookmarks(data.bookmarks || []); // [NEW]
                setCustomBackdrop(data.customBackdrop || null);
                setCustomInstructions(data.customInstructions || '');
                setIsIncognito(data.isIncognito || false);
            } else {
                const newTab = getInitialTab();
                setTabs([newTab]);
                setActiveTabId(newTab.id);
                setArchivedTabs([]);
                setDownloads([]);
                setGlobalHistory([]);
                setBookmarks([]); // [NEW]
                setCustomBackdrop(null);
                setCustomInstructions('');
                setIsIncognito(false);
            }
        } catch (e) {
            console.error("Failed to load user data", e);
            const newTab = getInitialTab();
            setTabs([newTab]);
            setActiveTabId(newTab.id);
            setArchivedTabs([]);
            setDownloads([]);
            setGlobalHistory([]);
            setCustomBackdrop(null);
            setCustomInstructions('');
            setIsIncognito(false);
        }
        setCurrentTheme(currentUser.theme);
        localStorage.setItem('deepsearch_current_user_id', userId);
    }, []);

    useEffect(() => {
        const userId = currentUser.id;
        const storageKey = `deepsearch_data_${userId}`;

        // In incognito mode, don't persist conversation history (tabs/archivedTabs/globalHistory)
        const dataToSave = isIncognito
            ? { downloads, customBackdrop, customInstructions, isIncognito, bookmarks }
            : { tabs, activeTabId, archivedTabs, downloads, customBackdrop, globalHistory, customInstructions, isIncognito, bookmarks };

        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }, [tabs, archivedTabs, activeTabId, downloads, customBackdrop, globalHistory, customInstructions, isIncognito, bookmarks]);

    useEffect(() => {
        localStorage.setItem('deepsearch_users', JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        localStorage.setItem('deepsearch_custom_extensions', JSON.stringify(customExtensions));
    }, [customExtensions]);

    useEffect(() => {
        if (currentUser.theme !== currentTheme) {
            const updatedUser = { ...currentUser, theme: currentTheme };
            setCurrentUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        }
    }, [currentTheme]);

    useEffect(() => {
        if (isIncognito) {
            document.documentElement.setAttribute('data-theme', 'incognito');
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.setAttribute('data-theme', currentTheme);
            if (currentTheme === 'light') {
                document.documentElement.classList.remove('dark');
            } else {
                document.documentElement.classList.add('dark');
            }
        }
    }, [currentTheme, isIncognito]);

    const toggleIncognito = () => {
        const newState = !isIncognito;
        setIsIncognito(newState);
        if (newState) {
            setCurrentTheme('incognito');
        } else {
            setCurrentTheme(currentUser.theme);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [tabs]);

    const handleToggleHistory = () => {
        if (activeSidebarApp) setActiveSidebarApp(null);
        setShowHistory(!showHistory);
    };

    const handleOpenApp = (appId: string) => {
        // Apps that should open in the sidebar panel
        const sidebarWidgets = ['notes', 'calculator'];

        // Apps that should open in a new browser tab
        const externalLinks: Record<string, string> = {


        };

        if (sidebarWidgets.includes(appId)) {
            if (showHistory) setShowHistory(false);
            if (activeSidebarApp === appId) {
                setActiveSidebarApp(null);
            } else {
                setActiveSidebarApp(appId);
            }
        } else if (externalLinks[appId]) {
            window.open(externalLinks[appId], '_blank');
        } else {
            // Check custom shortcuts
            const custom = currentUser.customShortcuts?.find(s => s.id === appId);
            if (custom) {
                window.open(custom.url, '_blank');
            }
        }
    };

    const handleSwitchUser = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            if (!user.enabledSidebarApps) user.enabledSidebarApps = ['notes', 'calculator'];
            if (!user.customShortcuts) user.customShortcuts = [];
            setCurrentUser(user);
        }
    };

    const handleAddUser = (name: string) => {
        const newUser: UserProfile = {
            id: `user-${Date.now()}`,
            name: name,
            theme: 'red',
            avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
            enabledExtensions: [],
            enabledSidebarApps: ['notes', 'calculator'],
            customShortcuts: []
        };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
    };

    const handleToggleExtension = (extId: string) => {
        const currentExtensions = currentUser.enabledExtensions || [];
        let newExtensions;
        if (currentExtensions.includes(extId)) {
            newExtensions = currentExtensions.filter(id => id !== extId);
        } else {
            newExtensions = [...currentExtensions, extId];
        }

        const updatedUser = { ...currentUser, enabledExtensions: newExtensions };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleToggleSidebarApp = (appId: string) => {
        const currentApps = currentUser.enabledSidebarApps || [];
        let newApps;
        if (currentApps.includes(appId)) {
            newApps = currentApps.filter(id => id !== appId);
            if (activeSidebarApp === appId) setActiveSidebarApp(null);
        } else {
            newApps = [...currentApps, appId];
        }

        const updatedUser = { ...currentUser, enabledSidebarApps: newApps };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleAddCustomShortcut = (shortcut: CustomShortcut) => {
        const currentShortcuts = currentUser.customShortcuts || [];
        const newShortcuts = [...currentShortcuts, shortcut];
        const updatedUser = { ...currentUser, customShortcuts: newShortcuts };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleDeleteCustomShortcut = (id: string) => {
        const currentShortcuts = currentUser.customShortcuts || [];
        const newShortcuts = currentShortcuts.filter(s => s.id !== id);
        const updatedUser = { ...currentUser, customShortcuts: newShortcuts };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleSetModel = (model: string) => {
        const updatedUser = { ...currentUser, preferredModel: model };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleSetImageModel = (model: string) => {
        const updatedUser = { ...currentUser, preferredImageModel: model };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleCreateExtension = (ext: Extension) => {
        setCustomExtensions(prev => [...prev, ext]);
        handleToggleExtension(ext.id);
    };

    const handleDeleteExtension = (extId: string) => {
        setCustomExtensions(prev => prev.filter(e => e.id !== extId));
        const cleanUsers = users.map(u => ({
            ...u,
            enabledExtensions: u.enabledExtensions?.filter(id => id !== extId) || []
        }));
        setUsers(cleanUsers);
        if (currentUser.enabledExtensions?.includes(extId)) {
            const updatedUser = {
                ...currentUser,
                enabledExtensions: currentUser.enabledExtensions.filter(id => id !== extId)
            };
            setCurrentUser(updatedUser);
        }
    };

    const handleNewTab = () => {
        const currentActiveTab = tabs.find(t => t.id === activeTabId);
        if (currentActiveTab && currentActiveTab.messages.length > 0) {
            setArchivedTabs(prev => [currentActiveTab, ...prev]);
        }
        const newTab = getInitialTab();
        setTabs([newTab]);
        setActiveTabId(newTab.id);
    };

    const handleRestoreTab = (tabId: string) => {
        const tabToRestore = archivedTabs.find(t => t.id === tabId);
        if (tabToRestore) {
            const currentActiveTab = tabs.find(t => t.id === activeTabId);
            if (currentActiveTab && currentActiveTab.messages.length > 0) {
                setArchivedTabs(prev => [currentActiveTab, ...prev.filter(t => t.id !== tabId)]);
            } else {
                setArchivedTabs(prev => prev.filter(t => t.id !== tabId));
            }
            setTabs([tabToRestore]);
            setActiveTabId(tabId);
        }
    };

    const handleLoadHistory = (title: string) => {
        // Check if we already have an active tab with this title (optional optimization)
        // Or check if it exists in archived tabs
        const archived = archivedTabs.find(t => t.title === title);
        if (archived) {
            handleRestoreTab(archived.id);
            setShowHistory(false);
            return;
        }

        // Otherwise treat it as a new search query
        const newId = createNewTab();
        const newTab: Tab = {
            id: newId,
            title: title,
            messages: [
                { id: 'h1', role: Role.USER, content: title, timestamp: Date.now() }
            ],
            createdAt: Date.now(),
            browserState: { ...DEFAULT_BROWSER_STATE }
        };
        setTabs([newTab]);
        setActiveTabId(newId);
        setShowHistory(false);

        // TRIGGER THE SEARCH
        handleSendMessage(title);
    };

    const handleNavigate = (url: string) => {
        const currentTabId = activeTabId;
        let finalUrl = url.trim();
        // Check for 'query://' prefix locally first
        if (finalUrl.startsWith('query://')) {
            const query = finalUrl.replace('query://', '');
            handleSendMessage(query);
            return;
        }

        if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;

        let forceRedirect = false;
        try {
            const urlObj = new URL(finalUrl);
            const hostname = urlObj.hostname.toLowerCase();
            const unembeddableDomains = [
                'facebook.com', 'www.facebook.com', 'instagram.com', 'www.instagram.com',
                'netflix.com', 'www.netflix.com', 'chatgpt.com', 'openai.com',
                'github.com', 'linkedin.com', 'twitter.com', 'x.com', 'reddit.com', 'www.reddit.com'
            ];
            if (unembeddableDomains.some(d => hostname.endsWith(d))) forceRedirect = true;
            if (!forceRedirect) {
                if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
                    const videoMatch = finalUrl.match(/(?:v=|\/v\/|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                    if (videoMatch && videoMatch[1]) finalUrl = `https://www.youtube.com/embed/${videoMatch[1]}?autoplay=1`;
                } else if (hostname.includes('wikipedia.org')) {
                    urlObj.hostname = 'wikiless.org';
                    finalUrl = urlObj.toString();
                } else if (hostname.includes('google.com') && urlObj.pathname === '/search') {
                    if (!urlObj.searchParams.has('igu')) urlObj.searchParams.set('igu', '1');
                    finalUrl = urlObj.toString();
                }
            }
        } catch (e) { console.warn("URL parse failed", e); }

        // Persistent History
        if (!isIncognito) {
            const historyItem: HistoryItem = {
                id: `visit-${Date.now()}`,
                title: finalUrl,
                url: finalUrl,
                timestamp: Date.now(),
                type: 'visit'
            };
            setGlobalHistory(prev => [historyItem, ...prev].slice(0, 500));
        }

        setTabs(prev => prev.map(tab => {
            if (tab.id === currentTabId) {
                const currentState = tab.browserState;
                const newHistory = [...currentState.history.slice(0, currentState.currentIndex + 1), finalUrl];
                return {
                    ...tab,
                    browserState: {
                        ...currentState,
                        url: finalUrl,
                        displayUrl: finalUrl,
                        history: newHistory,
                        currentIndex: newHistory.length - 1,
                        isOpen: !forceRedirect,
                        key: currentState.key + 1
                    }
                };
            }
            return tab;
        }));
        if (forceRedirect) window.open(finalUrl, '_blank');
    };

    const handleExitIframe = () => {
        setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, browserState: { ...tab.browserState, isOpen: false } } : tab));
    };

    const handleSendMessage = async (text: string, attachments?: Attachment[], modeOverride?: SearchMode) => {
        const currentTabId = activeTabId;
        const effectiveMode = modeOverride || searchMode;
        const trimmedText = text.trim();
        const isUrl = /^(http(s)?:\/\/)|(www\.)|([-a-zA-Z0-9@:%._\+~#=]{2,256}\.(com|org|net|edu|gov|io|ai|co|uk|ca|de|jp|fr|au)\b)/i.test(trimmedText) && !trimmedText.includes(' ');

        if (isUrl && !attachments && effectiveMode === 'normal') {
            handleNavigate(trimmedText);
            return;
        }

        // Persistent History (Query)
        if (!isIncognito && trimmedText) {
            const historyItem: HistoryItem = {
                id: `search-${Date.now()}`,
                title: trimmedText.slice(0, 60),
                url: `query://${trimmedText}`,
                timestamp: Date.now(),
                type: 'search'
            };
            setGlobalHistory(prev => [historyItem, ...prev].slice(0, 500));
        }

        const userMsg: Message = { id: Date.now().toString(), role: Role.USER, content: text, timestamp: Date.now(), attachments: attachments };

        setTabs(prev => prev.map(tab => {
            if (tab.id === currentTabId) {
                // Don't add duplicate if we just created it in handleLoadHistory
                const lastMsg = tab.messages[tab.messages.length - 1];
                if (lastMsg && lastMsg.content === text && lastMsg.role === Role.USER && (Date.now() - lastMsg.timestamp < 500)) {
                    return tab;
                }

                const displayTitle = text ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) : 'Media Generation';
                const title = tab.messages.length === 0 ? displayTitle : tab.title;
                return { ...tab, title, messages: [...tab.messages, userMsg] };
            }
            return tab;
        }));

        const botMsgId = (Date.now() + 1).toString();
        const botMsg: Message = { id: botMsgId, role: Role.MODEL, content: '', timestamp: Date.now(), isStreaming: true };

        setTabs(prev => prev.map(tab => tab.id === currentTabId ? { ...tab, messages: [...tab.messages, botMsg] } : tab));

        const currentTab = tabs.find(t => t.id === currentTabId);
        const history = currentTab ? [...currentTab.messages, userMsg] : [userMsg];

        if (effectiveMode === 'simple') {
            setTabs(prev => prev.map(tab => tab.id === currentTabId ? { ...tab, messages: tab.messages.map(m => m.id === botMsgId ? { ...m, isStreaming: false, content: '' } : m) } : tab));
            window.location.href = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
        } else if (effectiveMode === 'image') {
            try {
                const result = await generateImage(text, currentUser.preferredImageModel || 'gemini-2.5-flash-image', attachments);
                setTabs(prev => prev.map(tab => tab.id === currentTabId ? { ...tab, messages: tab.messages.map(m => m.id === botMsgId ? { ...m, isStreaming: false, generatedMedia: result } : m) } : tab));
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                setTabs(prev => prev.map(tab => tab.id === currentTabId ? { ...tab, messages: tab.messages.map(m => m.id === botMsgId ? { ...m, isStreaming: false, content: `Error generating image: ${errorMessage}` } : m) } : tab));
            }
        } else if (effectiveMode === 'video') {
            try {
                const result = await generateVideo(text);
                setTabs(prev => prev.map(tab => tab.id === currentTabId ? { ...tab, messages: tab.messages.map(m => m.id === botMsgId ? { ...m, isStreaming: false, generatedMedia: result } : m) } : tab));
            } catch (e) {
                setTabs(prev => prev.map(tab => tab.id === currentTabId ? { ...tab, messages: tab.messages.map(m => m.id === botMsgId ? { ...m, isStreaming: false, content: "Error generating video." } : m) } : tab));
            }
        } else {
            const activeExtensionIds = currentUser.enabledExtensions || [];
            const activeExtensions = allExtensions.filter(ext => activeExtensionIds.includes(ext.id));

            await streamGeminiResponse(
                history, effectiveMode, activeExtensions, currentUser.preferredModel || 'gemini-flash-latest',
                customInstructions,
                (textChunk, sources) => {
                    setTabs(prev => prev.map(tab => tab.id === currentTabId ? { ...tab, messages: tab.messages.map(msg => msg.id === botMsgId ? { ...msg, content: msg.content + textChunk, sources: sources || msg.sources } : msg) } : tab));
                },
                () => {
                    setTabs(prev => prev.map(tab => tab.id === currentTabId ? { ...tab, messages: tab.messages.map(msg => msg.id === botMsgId ? { ...msg, isStreaming: false } : msg) } : tab));
                },
                (error) => {
                    setTabs(prev => prev.map(tab => tab.id === currentTabId ? { ...tab, messages: tab.messages.map(msg => msg.id === botMsgId ? { ...msg, content: msg.content + `\n\n*[Error: ${error.message}]*`, isStreaming: false } : msg) } : tab));
                }
            );
        }
    };

    const activeTab = tabs.find(t => t.id === activeTabId);
    const browserState = activeTab?.browserState;
    const isIframeOpen = browserState?.isOpen && browserState?.url;

    return (
        <div
            className="relative w-full h-[100dvh] overflow-hidden font-sans text-zen-text bg-zen-bg transition-colors duration-500 bg-cover bg-center"
            style={
                customBackdrop ? { backgroundImage: `url(${customBackdrop})` } :
                    currentTheme === 'galaxy' ? { backgroundImage: `url(${GALAXY_IMG})` } :
                        {}
            }
        >
            {/* Background Layer */}
            {(customBackdrop || currentTheme === 'galaxy') && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none z-0" />}

            {/* Dock (Left) */}
            <SaturnDock
                onNewTab={handleNewTab}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onToggleHistory={handleToggleHistory}
                isHistoryOpen={showHistory}
                activeApp={activeSidebarApp}
                onOpenApp={handleOpenApp}
                enabledApps={currentUser.enabledSidebarApps || []}
                customShortcuts={currentUser.customShortcuts || []}
            />

            {/* Overlays */}
            <HistoryView
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                history={globalHistory}
                archivedTabs={archivedTabs}
                onSelectHistory={(item) => {
                    if (item.type === 'visit') {
                        handleNavigate(item.url);
                        setShowHistory(false);
                    } else {
                        handleLoadHistory(item.title);
                    }
                }}
                onRestoreTab={(id) => {
                    handleRestoreTab(id);
                    setShowHistory(false);
                }}
                onClear={() => setGlobalHistory([])}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                theme={currentTheme}
                setTheme={setCurrentTheme}
                isIncognito={isIncognito}
                toggleIncognito={toggleIncognito}
                customBackdrop={customBackdrop}
                setCustomBackdrop={setCustomBackdrop}
                enabledSidebarApps={currentUser.enabledSidebarApps || []}
                toggleSidebarApp={handleToggleSidebarApp}
                currentUser={currentUser}
                users={users}
                onSwitchUser={handleSwitchUser}
                onAddUser={handleAddUser}
                downloads={downloads}
                availableExtensions={allExtensions}
                onToggleExtension={handleToggleExtension}
                onCreateExtension={handleCreateExtension}
                onDeleteExtension={handleDeleteExtension}
                onAddCustomShortcut={handleAddCustomShortcut}
                onDeleteCustomShortcut={handleDeleteCustomShortcut}
                onSetModel={handleSetModel}
                onSetImageModel={handleSetImageModel}
                tabs={tabs}
                setTabs={setTabs}
                archivedTabs={archivedTabs}
                setArchivedTabs={setArchivedTabs}
                customInstructions={customInstructions}
                setCustomInstructions={setCustomInstructions}
            />

            <SidebarPanel
                isOpen={!!activeSidebarApp}
                appId={activeSidebarApp}
                onClose={() => setActiveSidebarApp(null)}
            />

            {/* Main Content Area */}
            <div className="absolute inset-0 left-0 md:left-24 right-0 bottom-0 top-0 flex flex-col overflow-hidden z-0">
                {isIframeOpen && browserState ? (
                    <div className="relative w-full h-full animate-scale-in bg-zen-surface/95 z-40 rounded-none md:rounded-l-[2rem] overflow-hidden border-l-0 md:border-l border-y border-zen-border shadow-2xl backdrop-blur-xl">
                        <button
                            onClick={handleExitIframe}
                            className="absolute top-4 right-4 z-50 bg-black/50 border border-white/10 text-white px-4 py-2 rounded-full shadow-xl hover:bg-zen-accent hover:border-transparent transition-all flex items-center gap-2 font-bold text-xs group backdrop-blur-md hover:shadow-glow"
                        >
                            <X className="w-3.5 h-3.5" />
                            Close Browser
                        </button>
                        <iframe
                            key={browserState.key}
                            src={browserState.url}
                            className="w-full h-full border-0 bg-white"
                            title="Search Results"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
                        {/* Bookmarks Bar [NEW] */}
                        {(bookmarks.length > 0 || !activeTab?.messages.length) && (
                            <div className="w-full bg-zen-surface/30 border-b border-zen-border/30">
                                <BookmarksBar
                                    bookmarks={bookmarks}
                                    onSelectBookmark={(b) => handleNavigate(b.query)}
                                    onRemoveBookmark={(id, e) => {
                                        e.stopPropagation();
                                        setBookmarks(prev => prev.filter(b => b.id !== id));
                                    }}
                                />
                            </div>
                        )}

                        {/* Messages Container */}
                        <div className="flex-1 w-full h-full overflow-y-auto pb-48 md:pb-32 px-4 md:px-8 pt-4 scrollbar-thumb-zen-accent scrollbar-track-transparent">
                            <div className="max-w-4xl mx-auto w-full pt-12 min-h-full flex flex-col">
                                {!activeTab?.messages.length ? (
                                    <div className="flex-1 flex flex-col items-center justify-center animate-slide-up select-none">
                                        <div className="mb-8 relative flex items-center justify-center group">
                                            <div className="absolute inset-0 bg-zen-accent/20 blur-3xl rounded-full animate-pulse-slow" />
                                            <div className="w-24 h-24 rounded-2xl bg-zen-surface border border-zen-border flex items-center justify-center text-zen-accent shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
                                                <svg viewBox="0 0 100 100" className="w-12 h-12 fill-current">
                                                    <circle cx="50" cy="50" r="20" />
                                                    <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="8" transform="rotate(-15 50 50)" />
                                                </svg>
                                            </div>
                                        </div>
                                        <h1 className="text-4xl font-bold mb-4 text-zen-text tracking-tighter">Saturn</h1>
                                        <p className="text-zen-muted text-lg font-medium opacity-60">How can I help you today?</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col justify-end flex-1 space-y-6 pb-4">
                                        {activeTab.messages.map((msg) => (
                                            <MessageBubble
                                                key={msg.id}
                                                message={msg}
                                                onDownload={(i) => setDownloads(prev => [i, ...prev])}
                                                onNavigate={handleNavigate}
                                            />
                                        ))}
                                        {activeTab.messages[activeTab.messages.length - 1]?.isStreaming && !activeTab.messages[activeTab.messages.length - 1]?.content && (
                                            <div className="flex justify-start animate-fade-in pl-4">
                                                <div className="flex gap-1.5 items-center h-10">
                                                    <div className="w-1.5 h-1.5 bg-zen-accent rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                                    <div className="w-1.5 h-1.5 bg-zen-accent rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                                    <div className="w-1.5 h-1.5 bg-zen-accent rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>
                        </div>




                        {/* Floating OmniBar */}
                        <div className="absolute bottom-24 md:bottom-6 left-0 right-0 z-30 flex justify-center pointer-events-none">
                            <div className="w-full max-w-4xl pointer-events-auto">
                                <OmniBar
                                    onSend={(text, attach) => handleSendMessage(text, attach)}
                                    disabled={activeTab?.messages[activeTab.messages.length - 1]?.isStreaming || false}
                                    mode={searchMode}
                                    setMode={setSearchMode}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}