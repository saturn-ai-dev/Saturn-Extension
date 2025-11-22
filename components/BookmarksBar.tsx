import React from 'react';
import { Star, X, BookMarked } from 'lucide-react';
import { Bookmark } from '../types';

interface BookmarksBarProps {
  bookmarks: Bookmark[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  onRemoveBookmark: (id: string, e: React.MouseEvent) => void;
}

const BookmarksBar: React.FC<BookmarksBarProps> = ({ bookmarks, onSelectBookmark, onRemoveBookmark }) => {
  if (bookmarks.length === 0) return null;

  return (
    <div className="h-9 bg-zen-bg border-b border-zen-border flex items-center px-4 gap-2 select-none shrink-0 overflow-x-auto no-scrollbar animate-fade-in">
      {bookmarks.map((bookmark) => (
        <button
          key={bookmark.id}
          onClick={() => onSelectBookmark(bookmark)}
          className="group flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-medium text-zen-muted hover:text-zen-text hover:bg-zen-surface transition-all border border-transparent hover:border-zen-border/50 max-w-[200px] relative"
          title={bookmark.title}
        >
          {/* Icon */}
          <div className="w-3.5 h-3.5 flex items-center justify-center">
             <img 
                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(bookmark.title)}&sz=32`} 
                alt="" 
                className="w-3 h-3 opacity-70 grayscale group-hover:grayscale-0 transition-all"
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                }}
             />
             <Star className="w-3 h-3 text-zen-muted group-hover:text-yellow-500 transition-colors absolute opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100" />
          </div>

          <span className="truncate max-w-[120px]">{bookmark.title}</span>
          
          <div
            role="button"
            onClick={(e) => onRemoveBookmark(bookmark.id, e)}
            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
          >
            <X className="w-2.5 h-2.5" />
          </div>
        </button>
      ))}
    </div>
  );
};

export default BookmarksBar;