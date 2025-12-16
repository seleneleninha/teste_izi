// Error Boundary Component for iziBrokerz
// Catches JavaScript errors anywhere in the child component tree

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to error reporting service
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // TODO: Send to Sentry or other error tracking service
        // logErrorToService(error, errorInfo);
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen bg-gray-50 dark:bg-midnight-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
                        {/* Icon */}
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Ops! Algo deu errado
                        </h1>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Encontramos um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
                        </p>

                        {/* Error details (only in development) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 text-left bg-gray-100 dark:bg-slate-900 rounded-lg p-4">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Detalhes do erro (dev only)
                                </summary>
                                <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && (
                                        <div className="mt-2 text-gray-600 dark:text-gray-400">
                                            {this.state.errorInfo.componentStack}
                                        </div>
                                    )}
                                </pre>
                            </details>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                            >
                                <RefreshCw size={18} />
                                Tentar Novamente
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                            >
                                <Home size={18} />
                                Ir para Início
                            </button>
                        </div>

                        {/* Help text */}
                        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                            Se o problema persistir, entre em contato pelo{' '}
                            <a
                                href="https://wa.me/5584999999999"
                                className="text-emerald-500 hover:text-emerald-600 font-medium"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                WhatsApp
                            </a>
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

/**
 * Hook-based error boundary wrapper (alternative)
 */
export const withErrorBoundary = <P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) => {
    return (props: P) => (
        <ErrorBoundary fallback={fallback}>
            <Component {...props} />
        </ErrorBoundary>
    );
};
