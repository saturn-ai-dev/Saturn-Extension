import React, { useState, useEffect } from 'react';
import { Check, Copy, Download, Edit2, Eye, Code, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeArtifactProps {
    code: string;
    language: string;
    filename?: string;
    onSave?: (newCode: string) => void;
}

export const CodeArtifact: React.FC<CodeArtifactProps> = ({
    code: initialCode,
    language,
    filename = 'example',
    onSave,
}) => {
    const [code, setCode] = useState(initialCode);
    const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
    const [isEditing, setIsEditing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [editBuffer, setEditBuffer] = useState(code);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Determine if the content is renderable (HTML or simple React/JS)
    const isRenderable = ['html', 'svg', 'javascript', 'react', 'jsx', 'tsx'].includes(language.toLowerCase());

    useEffect(() => {
        setCode(initialCode);
        setEditBuffer(initialCode);
    }, [initialCode]);

    // Effect to handle escape key to exit full screen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullScreen) {
                setIsFullScreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreen]);

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${language === 'react' ? 'jsx' : language}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const toggleEdit = () => {
        if (isEditing) {
            // Cancel edit
            setEditBuffer(code);
            setIsEditing(false);
        } else {
            // Start edit
            setActiveTab('code'); // Force view to code when editing
            setIsEditing(true);
        }
    };

    const saveEdit = () => {
        setCode(editBuffer);
        setIsEditing(false);
        if (onSave) onSave(editBuffer);
    };

    return (
        <div className={`
      w-full border border-white/10 rounded-xl bg-[#0d1117]/80 shadow-2xl overflow-hidden my-4 group backdrop-blur-md transition-all duration-300 hover:border-zen-accent/30
      ${isFullScreen ? 'fixed inset-0 z-50 rounded-none m-0 h-[100dvh] flex flex-col' : ''}
    `}>
            {/* --- Header / Toolbar --- */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5 flex-shrink-0">

                {/* Left: Tab Switcher (The "Stack" Control) */}
                <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('code')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${activeTab === 'code'
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Code size={14} />
                        Code
                    </button>

                    {isRenderable && (
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${activeTab === 'preview'
                                    ? 'bg-zen-accent text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Eye size={14} />
                            Preview
                        </button>
                    )}
                </div>

                {/* Right: Actions (Copy, Download, Edit) */}
                <div className="flex items-center gap-2">
                    {!isEditing && (
                        <>
                            <button
                                onClick={handleCopy}
                                className="p-1.5 rounded-lg bg-white/5 text-gray-400 border border-transparent hover:border-white/10 hover:bg-white/10 hover:text-white transition-all"
                                title="Copy code"
                            >
                                {isCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                            </button>

                            <button
                                onClick={handleDownload}
                                className="p-1.5 rounded-lg bg-white/5 text-gray-400 border border-transparent hover:border-white/10 hover:bg-white/10 hover:text-white transition-all"
                                title="Download file"
                            >
                                <Download size={16} />
                            </button>
                        </>
                    )}

                    <button
                        onClick={isEditing ? saveEdit : toggleEdit}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${isEditing
                                ? 'bg-zen-accent text-white hover:bg-zen-accent/80'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                        title={isEditing ? 'Save changes' : 'Edit file'}
                    >
                        {isEditing ? (
                            <>
                                <Check size={14} /> Save
                            </>
                        ) : (
                            <>
                                <Edit2 size={14} />
                            </>
                        )}
                    </button>

                    <button
                        onClick={toggleFullScreen}
                        className="p-1.5 rounded-lg bg-white/5 text-gray-400 border border-transparent hover:border-white/10 hover:bg-white/10 hover:text-white transition-all"
                        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                    >
                        {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </div>

            {/* --- Content Area --- */}
            <div className={`relative bg-[#0d1117] ${isFullScreen ? 'flex-1 h-full' : ''}`}>
                {activeTab === 'code' ? (
                    isEditing ? (
                        <textarea
                            value={editBuffer}
                            onChange={(e) => setEditBuffer(e.target.value)}
                            className={`w-full p-4 font-mono text-sm bg-[#0d1117] text-gray-300 resize-none focus:outline-none border-none ${isFullScreen ? 'h-full text-base' : 'min-h-[50px]'}`}
                            spellCheck={false}
                        />
                    ) : (
                        <div className={`overflow-y-auto text-sm custom-scrollbar ${isFullScreen ? 'h-full' : 'max-h-[500px]'}`}>
                            <SyntaxHighlighter
                                language={language}
                                style={vscDarkPlus}
                                customStyle={{
                                    margin: 0,
                                    padding: '1.5rem',
                                    minHeight: isFullScreen ? '100%' : 'auto', // Remove fixed minHeight for non-fs
                                    background: 'transparent',
                                    fontSize: isFullScreen ? '16px' : '14px'
                                }}
                                showLineNumbers={true}
                                lineNumberStyle={{ minWidth: '2em', paddingRight: '1em', color: '#6e7681', textAlign: 'right' }}
                            >
                                {code}
                            </SyntaxHighlighter>
                        </div>
                    )
                ) : (
                    <PreviewFrame code={code} language={language} isFullScreen={isFullScreen} />
                )}
            </div>
        </div>
    );
};

// --- Helper Component for Safe Rendering ---
const PreviewFrame: React.FC<{ code: string; language: string; isFullScreen?: boolean }> = ({ code, language, isFullScreen }) => {
    const [key, setKey] = useState(0); // Used to reload iframe on refresh

    const getSrcDoc = () => {
        if (language === 'html') {
            return code;
        }

        // Basic support for React/JSX (Simulated for this example)
        if (language === 'react' || language === 'jsx' || language === 'javascript' || language === 'tsx') {
            return `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>body { padding: 20px; background: white; }</style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel">
              const { useState, useEffect, useRef, useMemo } = React;
              try {
                // Try to find the default export or the last defined component
                ${code}
                
                // Heuristic to render the App component if defined, or generic 'App'
                if (typeof App !== 'undefined') {
                  const root = ReactDOM.createRoot(document.getElementById('root'));
                  root.render(<App />);
                } else if (typeof Example !== 'undefined') {
                  const root = ReactDOM.createRoot(document.getElementById('root'));
                  root.render(<Example />);
                } else if (typeof Component !== 'undefined') {
                  const root = ReactDOM.createRoot(document.getElementById('root'));
                  root.render(<Component />);
                } else {
                   // Fallback: try to find a function that looks like a component
                   const potentialComponent = Object.values(window).find(v => typeof v === 'function' && /^[A-Z]/.test(v.name));
                   if (potentialComponent) {
                        const root = ReactDOM.createRoot(document.getElementById('root'));
                        root.render(React.createElement(potentialComponent));
                   } else {
                        document.getElementById('root').innerHTML = '<div class="text-red-500">Could not automatically find a React component (e.g. "App", "Example") to render.</div>';
                   }
                }
              } catch (err) {
                document.getElementById('root').innerHTML = '<div class="text-red-500 p-4 bg-red-50 border border-red-200 rounded">Runtime Error: ' + err.message + '</div>';
              }
            </script>
          </body>
        </html>
      `;
        }
        return '';
    };

    return (
        <div className={`w-full flex flex-col bg-white overflow-hidden ${isFullScreen ? 'h-full rounded-none' : 'h-full min-h-[300px] rounded-b-xl'}`}>
            <div className="flex justify-end p-2 border-b border-gray-100 bg-white flex-shrink-0">
                <button
                    onClick={() => setKey(prev => prev + 1)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors font-medium"
                >
                    <RefreshCw size={12} /> Reload Preview
                </button>
            </div>
            <iframe
                key={key}
                title="Preview"
                srcDoc={getSrcDoc()}
                className="w-full flex-1 border-0"
                sandbox="allow-scripts allow-same-origin"
            />
        </div>
    );
};

export default CodeArtifact;
