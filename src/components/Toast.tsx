import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const Icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const Icon = Icons[type];

  return (
    <div className={`fixed top-4 left-4 right-4 z-[100] flex items-start p-4 rounded-xl shadow-lg border animate-[slideIn_0.3s_ease-out] ${styles[type]}`}>
      <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 text-current opacity-60 hover:opacity-100">
        <X size={18} />
      </button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Toast;