import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('React render error:', error, errorInfo);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message =
      this.state.error instanceof Error
        ? `${this.state.error.name}: ${this.state.error.message}`
        : String(this.state.error);

    return (
      <div className="min-h-screen p-6 bg-white text-slate-900">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <button
          type="button"
          className="mt-4 btn-primary"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
        {import.meta.env.DEV && this.state.error?.stack && (
          <pre className="mt-4 text-xs whitespace-pre-wrap text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
            {this.state.error.stack}
          </pre>
        )}
      </div>
    );
  }
}

