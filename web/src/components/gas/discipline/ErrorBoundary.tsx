"use client";
import React from "react";

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: any) { console.error("Caught by ErrorBoundary:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, backgroundColor: '#450a0a', color: 'white', minHeight: '100vh' }}>
          <h2 className="text-2xl font-bold mb-4">🚨 Crash Terdeteksi di Halaman Ini!</h2>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#000', padding: 20, borderRadius: 10 }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#000', padding: 20, borderRadius: 10, marginTop: 10, fontSize: '12px' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
