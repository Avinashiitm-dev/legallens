import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-zinc-300 mb-4">
            Something went wrong
          </h1>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-sm overflow-auto max-w-2xl w-full">
            <p className="font-mono text-zinc-300 mb-4">
              {this.state.error?.toString()}
            </p>
            <pre className="text-slate-400 whitespace-pre-wrap">
              {this.state.error?.stack}
            </pre>
          </div>
          <button
            className="mt-8 px-6 py-2 bg-white text-slate-950 font-bold rounded-lg hover:bg-slate-200 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
