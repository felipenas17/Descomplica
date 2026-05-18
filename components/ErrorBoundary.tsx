'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-10 bg-rose-50/30 rounded-[3rem] border border-rose-100 text-center">
          <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 font-display mb-4">Ops! Algo deu errado.</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-10 font-medium">
            Ocorreu um erro inesperado nesta visualização. Se o erro persistir, entre em contato com o suporte.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <RefreshCcw size={18} />
            RECARREGAR APLICAÇÃO
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
