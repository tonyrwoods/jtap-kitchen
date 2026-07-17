import { Component } from "react";
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || String(this.state.error);
      const stack = this.state.error?.stack || this.state.errorInfo?.componentStack || "";

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="font-heading text-3xl font-bold text-primary/30">Oops</h1>
              <div className="h-0.5 w-16 bg-primary mx-auto rounded-full" />
            </div>
            <div className="space-y-3">
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Something went wrong
              </h2>
              <p className="font-body text-muted-foreground leading-relaxed">
                An unexpected error occurred. Try reloading the page — if the problem persists, our team has been notified.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Page
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-full font-body text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </a>
            </div>

            {/* Collapsible error details for debugging */}
            {errorMessage && (
              <div className="pt-4 border-t border-border">
                <button
                  onClick={this.toggleDetails}
                  className="inline-flex items-center gap-1 font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {this.state.showDetails ? "Hide details" : "Show details"}
                </button>
                {this.state.showDetails && (
                  <pre className="mt-3 text-left text-xs font-mono bg-muted rounded-lg p-4 overflow-x-auto max-h-40 text-muted-foreground whitespace-pre-wrap break-words">
                    {errorMessage}
                    {stack && "\n\n" + stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}