
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export type SearchMode = 'fast' | 'normal' | 'pro' | 'image' | 'video' | 'direct' | 'simple';
export type Theme = 'red' | 'blue' | 'incognito' | 'glass' | 'light' | 'blackbox' | 'charcoal-cosmic' | 'galaxy';

export interface Source {
  title?: string;
  uri: string;
}

export interface Attachment {
  file: File;
  preview: string;
  base64: string; // Raw base64 data without prefix
  mimeType: string;
  name?: string;
}

export interface GeneratedMedia {
  type: 'image' | 'video';
  uri: string; // base64 data URI or remote URL
  mimeType: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  sources?: Source[];
  isStreaming?: boolean;
  attachment?: Attachment; // Deprecated, kept for backward compatibility
  attachments?: Attachment[]; // New: support multiple attachments
  generatedMedia?: GeneratedMedia;
  iframeUrl?: string; // kept for backward compatibility or specific message embeds
}

export interface BrowserState {
  url: string;
  displayUrl?: string;
  history: string[];
  currentIndex: number;
  isOpen: boolean;
  key: number; // Used to force reload iframe
}

export interface Tab {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  browserState: BrowserState;
  groupId?: string; // New: Group/Project ID
  renameAttempted?: boolean;
}

export interface ThreadGroup {
  id: string;
  name: string;
  color?: string; // e.g. hex code or tailwind class equivalent
  createdAt: number;
}

export interface Bookmark {
  id: string;
  title: string;
  query: string;
  createdAt: number;
}

export interface DownloadItem {
  id: string;
  filename: string;
  timestamp: number;
  type: 'image' | 'video' | 'pdf' | 'file';
  uri?: string;
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  instruction: string; // The system prompt injection
  widgets?: { type: string; content: string }[];
}

export interface CustomShortcut {
  id: string;
  label: string;
  url: string;
  emoji: string;
}

export interface UserProfile {
  id: string;
  name: string;
  theme: Theme;
  avatarColor: string;
  enabledExtensions: string[];
  enabledSidebarApps: string[];
  customShortcuts: CustomShortcut[];
  preferredModel?: string;
  preferredImageModel?: string;
  openaiApiKey?: string;
  preferredOpenAIModel?: string;
  sidebarPosition?: 'left' | 'right';
  sidebarAutoHide?: boolean;
  sidebarShowStatus?: boolean;
  sidebarGlassIntensity?: number;
  autoRenameChats?: boolean;
}

export interface ChatState {
  tabs: Tab[];
  activeTabId: string;
  isSidebarOpen: boolean;
  searchMode: SearchMode;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  timestamp: number;
  type: 'search' | 'visit';
}
