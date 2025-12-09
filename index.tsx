import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import Prism from 'prismjs';

// Manually attach to window for side-effect imports
// @ts-ignore
window.Prism = Prism;

import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/themes/prism-tomorrow.css';
import 'katex/dist/katex.min.css';
import './katex-custom.css';

// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => { });
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', background: '#222', height: '100vh' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);