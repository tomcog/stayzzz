import { useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { type AppAlert, dismissAlert } from '../lib/appAlerts';

interface AlertsModalProps {
  alerts: AppAlert[];
  onClose: () => void;
}

export function AlertsModal({ alerts: initialAlerts, onClose }: AlertsModalProps) {
  const [alerts, setAlerts] = useState(initialAlerts);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[0];
  const remaining = alerts.length - 1;

  const handleDismiss = () => {
    dismissAlert(currentAlert.id);
    advance();
  };

  const handleRemind = () => {
    advance();
  };

  const advance = () => {
    const next = alerts.slice(1);
    if (next.length === 0) {
      onClose();
    } else {
      setAlerts(next);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-[calc(100%-2rem)] max-w-sm mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className={`shrink-0 mt-0.5 ${currentAlert.type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`}>
              {currentAlert.type === 'warning'
                ? <AlertTriangle className="w-6 h-6" />
                : <Info className="w-6 h-6" />
              }
            </div>
            <p className="text-[15px] text-gray-800 leading-snug">
              {currentAlert.message}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100">
          <button
            onClick={handleDismiss}
            className="w-full px-6 py-3.5 text-[15px] font-medium text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Got it
          </button>
        </div>
        <div className="border-t border-gray-100">
          <button
            onClick={handleRemind}
            className="w-full px-6 py-3.5 text-[15px] text-gray-400 hover:bg-gray-50 transition-colors"
          >
            Remind me next time
          </button>
        </div>

        {remaining > 0 && (
          <div className="border-t border-gray-100 px-6 py-2 text-center">
            <span className="text-xs text-gray-400">
              {remaining} more {remaining === 1 ? 'alert' : 'alerts'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
