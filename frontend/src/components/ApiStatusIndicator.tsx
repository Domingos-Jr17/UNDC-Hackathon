import { useApiHealth } from '../hooks/useApi';
import { WifiOff, AlertTriangle } from 'lucide-react';

export const ApiStatusIndicator: React.FC = () => {
  const { isHealthy, lastCheck } = useApiHealth();

  if (isHealthy === null) {
    return (
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-200 bg-white/95 px-3 py-2 text-xs text-amber-700 shadow-lg backdrop-blur">
        <AlertTriangle className="h-3 w-3" />
        <span>A verificar ligação à API...</span>
      </div>
    );
  }

  if (isHealthy) {
    return null;
  }

  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-rose-200 bg-white/95 px-3 py-2 text-xs text-rose-700 shadow-lg backdrop-blur">
      <WifiOff className="h-3 w-3" />
      <span>API indisponível</span>
      {lastCheck && (
        <span className="text-slate-500">
          ({lastCheck.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
};
