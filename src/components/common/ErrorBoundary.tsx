import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-mono text-sm flex flex-col items-center justify-center">
          <div className="max-w-2xl w-full bg-slate-900 border border-rose-800 rounded-lg p-6 shadow-2xl">
            <h1 className="text-xl font-bold text-rose-500 mb-4 flex items-center gap-2">
              <span>⚠️</span> React Rendering Error
            </h1>
            <div className="bg-slate-950 p-4 rounded border border-slate-800 mb-4 overflow-x-auto text-rose-300">
              {this.state.error?.toString()}
            </div>
            {this.state.errorInfo && (
              <pre className="bg-slate-950 p-4 rounded border border-slate-800 text-xs text-slate-400 overflow-x-auto max-h-60">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-rose-600 text-white rounded font-bold hover:bg-rose-500 transition-colors"
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
