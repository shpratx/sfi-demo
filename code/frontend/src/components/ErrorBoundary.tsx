import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="flex flex-col items-center justify-center gap-4 p-8">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-text-secondary">An unexpected error occurred. Please try again.</p>
          <button
            type="button"
            className="rounded bg-ims-yellow px-4 py-2 font-medium text-text-primary hover:bg-ims-yellow-dark"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
