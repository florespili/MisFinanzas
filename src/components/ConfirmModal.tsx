import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#EDE8DF] p-6 w-full max-w-sm shadow-xl animate-scale-up">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isDestructive ? 'bg-[#FDECE8] text-[#E06A60]' : 'bg-[#F4EDFA] text-[#9678B6]'
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-base font-bold text-[#2D2721]">{title}</h3>
        </div>

        <p className="text-xs text-[#7A7267] leading-relaxed mb-6">{message}</p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-[#5A5247] hover:bg-[#F5EFE6] rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-2xs transition-all ${
              isDestructive
                ? 'bg-[#E06A60] hover:bg-[#D4594F] active:scale-95'
                : 'bg-[#9678B6] hover:bg-[#8666A6] active:scale-95'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
