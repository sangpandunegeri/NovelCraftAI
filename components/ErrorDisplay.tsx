
import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg flex items-start gap-4 my-4" role="alert">
      <div className="pt-1">
        <i className="fas fa-exclamation-triangle text-xl"></i>
      </div>
      <div className="flex-1">
        <p className="font-semibold">{message}</p>
        <div className="mt-3 flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors"
            >
              <i className="fas fa-sync-alt mr-2"></i>Coba Lagi
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded-lg text-xs transition-colors"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;