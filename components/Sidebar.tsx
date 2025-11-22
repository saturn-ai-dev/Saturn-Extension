import React from 'react';
import { Plus, X, Settings } from 'lucide-react';
import { Tab } from '../types';

interface SidebarProps {
  isOpen: boolean;
  tabs: Tab[];
  activeTabId: string;
  onNewTab: () => void;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  toggleSidebar: () => void;
  onOpenSettings: () => void;
  onLoadHistory: (title: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  tabs,
  activeTabId,
  onNewTab,
  onSelectTab,
  onCloseTab,
  onOpenSettings,
}) => {
  return (
    <div className="w-full h-10 bg-zen-bg/90 backdrop-blur-sm border-b border-zen-border flex items-end px-2 gap-2 select-none z-50 flex-shrink-0 transition-colors duration-300 pt-2 app-drag">
        
        {/* Tabs Container */}
        {/* Removed app-no-drag from container so empty space is draggable */}
        <div className="flex-1 flex items-end h-full overflow-x-auto no-scrollbar gap-2 pr-2">
            {tabs.map((tab) => {
                const isActive = activeTabId === tab.id;
                return (
                    <div
                        key={tab.id}
                        onClick={() => onSelectTab(tab.id)}
                        className={`
                            group relative flex items-center gap-2 px-4 min-w-[140px] max-w-[240px] cursor-pointer transition-all duration-200 ease-out app-no-drag
                            ${isActive 
                                ? 'h-full bg-zen-surface text-zen-text rounded-t-lg border-t border-x border-zen-border text-xs font-medium shadow-sm relative z-10 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[1px] before:bg-zen-surface' 
                                : 'h-[80%] text-zen-muted hover:bg-zen-surface/40 hover:text-zen-text rounded-t-md text-xs opacity-70 hover:opacity-100 border-t border-transparent hover:border-zen-border/20'}
                        `}
                    >
                        <span className="truncate flex-1 pb-0.5">{tab.title || "New Tab"}</span>
                        <button
                            onClick={(e) => onCloseTab(tab.id, e)}
                            className={`p-0.5 rounded-md hover:bg-zen-text/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-zen-muted' : 'text-zen-muted'}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                );
            })}
            
            <button
                onClick={onNewTab}
                className="h-7 w-7 mb-1 flex items-center justify-center rounded-lg hover:bg-zen-surface text-zen-muted hover:text-zen-text transition-colors ml-1 flex-shrink-0 app-no-drag"
                title="New Tab"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 px-2 border-l border-zen-border/50 pl-2 h-1/2 my-auto app-no-drag">
             <button 
                onClick={onOpenSettings}
                className="p-1.5 text-zen-muted hover:text-zen-text hover:bg-zen-surface rounded-lg transition-colors"
             >
                <Settings className="w-3.5 h-3.5" />
             </button>
        </div>
    </div>
  );
};

export default Sidebar;