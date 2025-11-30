import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  showRetry?: boolean;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary for catching render errors in dynamic components
 * Prevents entire app from crashing when a component fails
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error for debugging
    console.error("[ErrorBoundary] Component error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo?.componentStack);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            border: "1px solid #fecaca",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            padding: "16px",
            margin: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ flexShrink: 0, color: "#ef4444" }}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#991b1b", margin: 0 }}>
                {this.props.componentName ? `Failed to render ${this.props.componentName}` : "Something went wrong"}
              </h3>
              {this.state.error && (
                <p style={{ marginTop: "4px", fontSize: "14px", color: "#dc2626" }}>{this.state.error.message}</p>
              )}
              {this.props.showRetry && (
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  style={{
                    marginTop: "8px",
                    fontSize: "14px",
                    color: "#b91c1c",
                    textDecoration: "underline",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
