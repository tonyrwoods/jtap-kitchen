import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <h1 className="font-heading text-5xl font-bold text-primary/30">Oops</h1>
              <div className="h-0.5 w-16 bg-primary mx-auto rounded-full" />
            </div>
            <div className="space-y-3">
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Something went wrong
              </h2>
              <p className="font-body text-muted-foreground leading-relaxed">
                An unexpected error occurred. Try refreshing the page.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 border border-border rounded-full font-body text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Try Again
              </button>
              <a
                href="/"
                className="px-8 py-3 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}