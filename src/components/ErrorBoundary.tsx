import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-[#050A15] p-8 text-white">
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Application Error</h1>
            <p className="mb-4 text-gray-300">The application encountered an unexpected error.</p>
            <pre className="p-4 bg-black/50 overflow-x-auto text-sm text-red-400 font-mono rounded">
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
