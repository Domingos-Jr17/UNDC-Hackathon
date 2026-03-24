import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { Spinner } from './ui/spinner';
import { TypographyH2 } from './ui/typography';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('VICTIM' | 'STAFF' | 'ADMIN')[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  redirectTo = '/'
}) => {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <TypographyH2>Verificando autenticação...</TypographyH2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecionar para login mas salvar a localização atual para retornar após login
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(user.role))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <TypographyH2>Acesso Não Autorizado</TypographyH2>
          <p className="text-muted-foreground mt-2">
            Não tem permissão para aceder a esta área.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
