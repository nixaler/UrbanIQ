import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('React error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 20,
          fontFamily: 'monospace',
          color: 'red',
          background: '#fff0f0',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2>App Error</h2>
          <pre style={{
            whiteSpace: 'pre-wrap',
            fontSize: 12,
            maxWidth: 800,
            overflow: 'auto'
          }}>
            {String(this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: '10px 20px',
              fontSize: 16,
              cursor: 'pointer',
              borderRadius: 5,
              border: 'none',
              background: '#0060A9',
              color: 'white'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}