import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TypographyH2, TypographyP, TypographyMuted } from '@/components/ui/typography';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Em produção, enviar para serviço de monitoramento de erros
    // logErrorToService(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Fallback customizado fornecido
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Fallback padrão
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Ops! Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado. Tente recarregar a página ou entre em contacto com o suporte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-muted rounded-md">
                  <TypographyMuted className="font-mono text-xs break-all">
                    {this.state.error.message}
                  </TypographyMuted>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button variant="outline" onClick={this.handleReload} className="w-full">
                  Recarregar Página
                </Button>
              </div>

              <TypographyMuted className="text-center text-xs">
                Se o problema persistir, contate o administrador do sistema.
              </TypographyMuted>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Boundary para componentes específicos com fallback customizado
interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary: () => void;
}

export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error: _error,
  resetErrorBoundary
}) => (
  <Card className="w-full max-w-sm mx-auto">
    <CardContent className="text-center p-6">
      <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-4" />
      <TypographyH2>Erro de Carregamento</TypographyH2>
      <TypographyP className="mb-4">
        Não foi possível carregar este componente.
      </TypographyP>
      <Button onClick={resetErrorBoundary} size="sm">
        Tentar Novamente
      </Button>
    </CardContent>
  </Card>
);

// Hook para Error Boundary funcional
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo);
    // Em produção, enviar para serviço de monitoramento
  };
};
