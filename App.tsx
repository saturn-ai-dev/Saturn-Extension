
import React, { useState, useEffect, useRef, useMemo } from 'react';
import SaturnSidebar from './components/SaturnSidebar';
import HistoryDrawer from './components/HistoryDrawer';
import SidebarPanel from './components/SidebarPanel';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import SettingsModal from './components/SettingsModal';
import { Tab, Message, Role, SearchMode, Attachment, Theme, Bookmark, DownloadItem, UserProfile, Extension, BrowserState, CustomShortcut, HistoryItem, ThreadGroup } from './types';
import { createNewTab, streamGeminiResponse, generateImage, generateVideo, generateChatTitle } from './services/geminiService';
import { X } from 'lucide-react';

const DEFAULT_USER: UserProfile = {
    id: 'default',
    name: 'Guest',
    theme: 'red',
    avatarColor: 'bg-red-600',
    enabledExtensions: [],
    enabledSidebarApps: ['notes', 'calculator', 'spotify', 'whatsapp', 'youtube', 'reddit', 'x'],
    customShortcuts: [],
    preferredModel: 'gemini-flash-latest',
    preferredImageModel: 'gemini-2.5-flash-image',
    autoRenameChats: true
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

interface AppProps {
    mode?: 'full' | 'sidebar';
}

export default function App({ mode = 'full' }: AppProps) {
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
    const [groups, setGroups] = useState<ThreadGroup[]>([]);
    const [downloads, setDownloads] = useState<DownloadItem[]>([]);
    const [globalHistory, setGlobalHistory] = useState<HistoryItem[]>([]);
    const [customInstructions, setCustomInstructions] = useState<string>('');

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeSidebarApp, setActiveSidebarApp] = useState<string | null>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [searchMode, setSearchMode] = useState<SearchMode>('normal');
    const [currentTheme, setCurrentTheme] = useState<Theme>(currentUser.theme);
    const [isIncognito, setIsIncognito] = useState(false);
    const [customBackdrop, setCustomBackdrop] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sidebarWidth, setSidebarWidth] = useState(70);

    // --- Persistence & User Switching ---
    useEffect(() => {
        const userId = currentUser.id;
        const storageKey = `deepsearch_data_${userId}`;

        try {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);

                // Check if incognito mode was previously enabled
                const wasIncognito = data.isIncognito || false;

                // If we're in incognito mode, don't load any chat history
                if (wasIncognito) {
                    const newTab = getInitialTab();
                    setTabs([newTab]);
                    setActiveTabId(newTab.id);
                    setArchivedTabs([]);
                    setGlobalHistory([]);
                    setIsIncognito(true);
                } else {
                    // ARCHIVE OLD TABS: Move any previous active tabs to archive
                    const previousTabs = data.tabs || [];
                    const previousArchives = data.archivedTabs || [];
                    // Filter out empty new tabs from archive to avoid clutter
                    const validPreviousTabs = previousTabs.filter((t: Tab) => t.messages.length > 0);

                    const newTab = getInitialTab();
                    setTabs([newTab]);
                    setActiveTabId(newTab.id);

                    setArchivedTabs([...validPreviousTabs, ...previousArchives]);
                    setGroups(data.groups || []);
                    setDownloads(data.downloads || []);
                    setGlobalHistory(data.globalHistory || []);
                    setCustomBackdrop(data.customBackdrop || null);
                    setCustomInstructions(data.customInstructions || '');
                    setIsIncognito(false);
                }
            } else {
                const newTab = getInitialTab();
                setTabs([newTab]);
                setActiveTabId(newTab.id);
                setArchivedTabs([]);
                setGroups([]);
                setDownloads([]);
                setGlobalHistory([]);
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
            setGroups([]);
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
            ? { downloads, customBackdrop, customInstructions, isIncognito, groups }
            : { tabs, activeTabId, archivedTabs, downloads, customBackdrop, globalHistory, customInstructions, isIncognito, groups };

        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }, [tabs, archivedTabs, activeTabId, downloads, customBackdrop, globalHistory, customInstructions, isIncognito, groups]);

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
            // Clear all chat history when entering incognito mode
            const newTab = getInitialTab();
            setTabs([newTab]);
            setActiveTabId(newTab.id);
            setArchivedTabs([]);
            setGlobalHistory([]);
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
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleOpenApp = (appId: string) => {
        // Apps that should open in the sidebar panel
        const sidebarWidgets = ['notes', 'calculator', 'twitch'];

        // Apps that should open in a new browser tab
        const externalLinks: Record<string, string> = {
            'spotify': 'https://open.spotify.com',
            'whatsapp': 'https://web.whatsapp.com',
            'reddit': 'https://www.reddit.com',
            'x': 'https://x.com',
            'youtube': 'https://www.youtube.com'
        };

        if (sidebarWidgets.includes(appId)) {
            if (isSidebarOpen) setIsSidebarOpen(false);
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
            if (!user.enabledSidebarApps) user.enabledSidebarApps = ['notes', 'calculator', 'spotify', 'whatsapp', 'youtube', 'reddit', 'x'];
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
            enabledSidebarApps: ['notes', 'calculator', 'spotify', 'whatsapp', 'youtube', 'reddit', 'x'],
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

    const handleToggleAutoRename = () => {
        const updatedUser = { ...currentUser, autoRenameChats: !currentUser.autoRenameChats };
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

    const handleDeleteArchivedTab = (tabId: string) => {
        console.log('Deleting archived tab:', tabId);
        setArchivedTabs(prev => {
            const newTabs = prev.filter(tab => tab.id !== tabId);
            console.log('Remaining tabs:', newTabs.map(t => t.id));
            return newTabs;
        });
    };

    const handleRenameArchivedTab = (tabId: string, newTitle: string) => {
        console.log('Renaming archived tab:', tabId, 'to:', newTitle);
        setArchivedTabs(prev => prev.map(tab =>
            tab.id === tabId ? { ...tab, title: newTitle } : tab
        ));
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

    const handleNavigate = (url: string) => {
        const currentTabId = activeTabId;
        let finalUrl = url.trim();
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

    const handleGetPageContext = async () => {
        // @ts-ignore - chrome API might not be fully typed in this context or requires checking
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.scripting) {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            // Simple text extraction
                            return document.body.innerText;
                        }
                    });

                    if (results && results[0] && results[0].result) {
                        const pageText = results[0].result;
                        const contextMsg = `Here is the content of the current page ("${tab.title}"):\n\n${pageText.substring(0, 15000)}`;
                        
                        // Send as a user message but maybe visually distinct? 
                        // For now just send it to the model.
                        handleSendMessage(contextMsg, []);
                    }
                }
            } catch (error) {
                console.error("Failed to get page context", error);
                // Maybe show a toast or error message
            }
        } else {
            console.warn("Chrome API not available");
        }
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
                const result = await generateImage(text, currentUser.preferredImageModel || 'gemini-2.5-flash-image');
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
                    setTabs(prev => {
                        const updatedTabs = prev.map(tab => tab.id === currentTabId ? { ...tab, messages: tab.messages.map(msg => msg.id === botMsgId ? { ...msg, isStreaming: false } : msg) } : tab);
                        return updatedTabs;
                    });
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

    const starField = useMemo(() => {
        if (currentTheme !== 'blackbox' && currentTheme !== 'galaxy') return null;
        const stars = Array.from({ length: currentTheme === 'galaxy' ? 20 : 50 }).map((_, i) => (
            <div key={`star-${i}`} className="star" style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.7 + 0.3
            }} />
        ));
        const fallingStars = Array.from({ length: 8 }).map((_, i) => (
            <div key={`falling-${i}`} className="falling-star" style={{
                top: `${Math.random() * 50 - 20}%`,
                left: `${Math.random() * 50 - 20}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${Math.random() * 2 + 4}s`
            }} />
        ));
        return <div className="cosmic-stars">{stars}{fallingStars}</div>;
    }, [currentTheme]);


    // --- Auto-Rename Effect ---
    useEffect(() => {
        if (currentUser.autoRenameChats === false) return;

        // Find tabs that need renaming:
        // 1. Title is default 'New Thread'
        // 2. Have at least 1 message (User) or more
        // 3. Not currently streaming
        // 4. Have NOT attempted rename yet
        const tabsToRename = tabs.filter(t => 
            t.title === 'New Thread' && 
            t.messages.length > 0 && 
            !t.messages[t.messages.length - 1].isStreaming &&
            !t.renameAttempted
        );
        
        if (tabsToRename.length === 0) return;

        // Mark them as attempted immediately to prevent loops
        setTabs(currentTabs => currentTabs.map(t => {
            if (tabsToRename.find(r => r.id === t.id)) {
                return { ...t, renameAttempted: true };
            }
            return t;
        }));

        // Trigger rename for each
        tabsToRename.forEach(tab => {
            console.log("Initiating auto-rename for tab:", tab.id);
            generateChatTitle(tab.messages).then(newTitle => {
                if (newTitle && newTitle !== 'New Chat') {
                     setTabs(currentTabs => currentTabs.map(t => t.id === tab.id ? { ...t, title: newTitle } : t));
                }
            });
        });
    }, [tabs, currentUser.autoRenameChats]);

    return (
        <div
            className="flex h-[100dvh] bg-zen-bg text-zen-text font-sans overflow-hidden transition-colors duration-500 bg-cover bg-center relative"
            style={
                customBackdrop ? { backgroundImage: `url(${customBackdrop})` } :
                    currentTheme === 'galaxy' ? { backgroundImage: `url(${GALAXY_IMG})` } :
                        {}
            }
        >
            {!customBackdrop && currentTheme !== 'blackbox' && currentTheme !== 'galaxy' && (
                <div className="mesh-bg">
                    <div className={`mesh-blob w-[600px] h-[600px] top-[-200px] left-[-200px] ${currentTheme === 'charcoal-cosmic' ? 'bg-orange-600/15' : 'bg-zen-accent/20'
                        }`}></div>
                    <div className={`mesh-blob w-[500px] h-[500px] bottom-[-100px] right-[-100px] ${currentTheme === 'charcoal-cosmic' ? 'bg-purple-900/20' : 'bg-blue-500/10'
                        }`} style={{ animationDelay: '5s' }}></div>
                </div>
            )}
            {!customBackdrop && starField}
            {(customBackdrop || currentTheme === 'galaxy') && <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none z-0" />}

            <SaturnSidebar
                onNewTab={handleNewTab}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onToggleHistory={handleToggleHistory}
                isHistoryOpen={isSidebarOpen}
                activeApp={activeSidebarApp}
                onOpenApp={handleOpenApp}
                enabledApps={currentUser.enabledSidebarApps || []}
                customShortcuts={currentUser.customShortcuts || []}
                width={sidebarWidth}
                onWidthChange={setSidebarWidth}
            />

            <HistoryDrawer
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                pastConversations={archivedTabs}
                onRestoreTab={handleRestoreTab}
                groups={groups}
                onCreateGroup={(name) => setGroups(prev => [...prev, { id: Date.now().toString(), name, createdAt: Date.now() }])}
                onDeleteGroup={(id) => {
                    setGroups(prev => prev.filter(g => g.id !== id));
                    setArchivedTabs(prev => prev.map(t => t.groupId === id ? { ...t, groupId: undefined } : t));
                }}
                onRenameGroup={(id, name) => setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g))}
                onMoveTabToGroup={(tabId, groupId) => setArchivedTabs(prev => prev.map(t => t.id === tabId ? { ...t, groupId } : t))}
                onDeleteArchivedTab={handleDeleteArchivedTab}
                onRenameArchivedTab={handleRenameArchivedTab}
            />

            <SidebarPanel
                isOpen={!!activeSidebarApp}
                appId={activeSidebarApp}
                onClose={() => setActiveSidebarApp(null)}
            />

            <div 
                className="flex-1 flex flex-col min-w-0 z-10 relative h-full transition-all duration-500"
                style={{ paddingLeft: `${sidebarWidth + 24}px` }}
            >
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
                    // New Props
                    currentUser={currentUser}
                    users={users}
                    onSwitchUser={handleSwitchUser}
                    onAddUser={handleAddUser}
                    downloads={downloads}
                    availableExtensions={allExtensions}
                    onToggleExtension={handleToggleExtension}
                    onCreateExtension={handleCreateExtension}
                    onDeleteExtension={handleDeleteExtension}
                    // Shortcuts
                    onAddCustomShortcut={handleAddCustomShortcut}
                    onDeleteCustomShortcut={handleDeleteCustomShortcut}
                    onSetModel={handleSetModel}
                    onSetImageModel={handleSetImageModel}
                    autoRenameChats={currentUser.autoRenameChats ?? true}
                    toggleAutoRenameChats={handleToggleAutoRename}
                    tabs={tabs}
                    setTabs={setTabs}
                    archivedTabs={archivedTabs}
                    setArchivedTabs={setArchivedTabs}
                    customInstructions={customInstructions}
                    setCustomInstructions={setCustomInstructions}
                />

                <div className="flex flex-col flex-1 overflow-hidden relative h-full transition-all duration-300">
                    <div className="flex-1 relative overflow-hidden">
                        {isIframeOpen && browserState ? (
                            <div className="relative w-full h-full animate-scale-in bg-white">
                                <button
                                    onClick={handleExitIframe}
                                    className="absolute top-4 right-4 z-50 bg-zen-surface border border-zen-border text-zen-text px-4 py-2 rounded-full shadow-xl hover:bg-zen-bg transition-colors flex items-center gap-2 font-bold text-sm group backdrop-blur-md hover:shadow-glow"
                                >
                                    <X className="w-4 h-4 group-hover:text-red-500 transition-colors" />
                                    Return to Chat
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
                            <>
                                <div className="absolute inset-0 overflow-y-auto scroll-smooth pb-96 custom-scrollbar">
                                    <div className="max-w-6xl mx-auto w-full px-8 pt-16 min-h-full flex flex-col">
                                        {!activeTab?.messages.length ? (
                                            <div className="flex-1 flex flex-col items-center justify-center animate-slide-up">
                                                <div className="mb-8 relative flex items-center justify-center group">
                                                    <div className="absolute inset-0 bg-zen-accent/20 blur-3xl rounded-full animate-pulse-slow" />
                                                    <svg viewBox="0 0 100 100" className="w-36 h-36 text-zen-accent animate-spin-slow opacity-90 relative z-10 filter drop-shadow-[0_0_20px_rgba(var(--accent-color-rgb),0.6)]">
                                                        <circle cx="50" cy="50" r="20" fill="currentColor" />
                                                        <ellipse cx="50" cy="50" rx="40" ry="10" fill="none" stroke="currentColor" strokeWidth="4" transform="rotate(-15 50 50)" />
                                                    </svg>
                                                </div>
                                                <h1 className="text-6xl font-bold mb-6 text-zen-text tracking-tighter text-center drop-shadow-lg">Saturn</h1>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col justify-end flex-1 pb-10">
                                                {activeTab.messages.map((msg) => (
                                                    <MessageBubble
                                                        key={msg.id}
                                                        message={msg}
                                                        onDownload={(i) => setDownloads(prev => [i, ...prev])}
                                                        onNavigate={handleNavigate}
                                                    />
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-6 pb-12 z-20 bg-gradient-to-t from-zen-bg via-zen-bg/80 to-transparent pointer-events-none">
                                    <div className="pointer-events-auto max-w-6xl mx-auto">
                                        <InputArea
                                            onSend={(text, attach) => handleSendMessage(text, attach)}
                                            disabled={activeTab?.messages[activeTab.messages.length - 1]?.isStreaming || false}
                                            mode={searchMode}
                                            setMode={setSearchMode}
                                            onGetContext={mode === 'sidebar' ? handleGetPageContext : undefined}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
