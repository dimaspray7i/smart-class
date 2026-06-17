import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to analytics/monitoring service
    if (window.__APP_MONITORING__) {
      window.__APP_MONITORING__.captureException(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-screen bg-base-cream retro-grid-bg flex items-center justify-center p-4"
        >
          <div className="retro-card p-8 max-w-2xl w-full bg-base-white">
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-6 border-4 border-base-black rounded-retro-lg flex items-center justify-center bg-danger shadow-[4px_4px_0px_0px_#111111]"
            >
              <AlertCircle className="w-10 h-10 text-base-white" />
            </motion.div>

            <h1 className="retro-heading text-3xl text-center mb-3">KESALAHAN SISTEM</h1>
            <p className="font-retro-mono text-center text-base-black/70 mb-6">
              Aplikasi mengalami masalah yang tidak terduga. Silakan coba lagi.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 p-4 bg-base-gray/20 rounded-retro border-2 border-base-black/10">
                <summary className="cursor-pointer font-black text-xs uppercase mb-3">
                  Detail Error (Dev Only)
                </summary>
                <div className="space-y-2 font-retro-mono text-[10px] text-base-black/60">
                  <p><strong>Message:</strong> {this.state.error?.message}</p>
                  <p><strong>Stack:</strong></p>
                  <pre className="bg-base-white p-2 rounded border border-base-black/20 overflow-auto max-h-48">
                    {this.state.error?.stack}
                  </pre>
                </div>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="primary"
                onClick={this.handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Beranda
              </Button>
            </div>

            <div className="absolute -top-3 -right-3 retro-sticker bg-retro-pink text-base-white text-xs px-3 py-1">
              ERROR #{this.state.errorCount}
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
