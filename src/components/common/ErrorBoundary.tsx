import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught runtime exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleHardReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[360px] flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/80 my-4 shadow-sm">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h3>
              <p className="text-sm text-slate-600">
                {this.props.fallbackSubtitle ||
                  'An unexpected view error occurred while rendering this section. Your data is safely stored in the database.'}
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-left text-xs font-mono text-slate-600 max-h-28 overflow-y-auto">
                <span className="text-rose-600 font-semibold">Error:</span> {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 bg-[#2E6FB0] hover:bg-[#23588D] text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleHardReload}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                Reload Portal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
