import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Application ErrorBoundary]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-amber-100 rounded-full flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Department Portal Notice</h2>
              <p className="text-xs text-gray-500 mt-1">
                An unexpected display issue occurred in the interface. Your saved form data and records remain secure.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center px-4 py-2 bg-[#1F3A6E] text-white text-xs font-semibold rounded hover:bg-[#152950] transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded hover:bg-gray-200 transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
