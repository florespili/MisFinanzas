import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType, DetailViewType } from '../types/finance';
import { formatCurrency, formatDateShort, formatMonthYear } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';
import { CategoryIcon } from './CategoryIcon';
import { ArrowLeft, Trash2, PieChart, Tag, Calendar, Plus } from 'lucide-react';

interface DetailViewModalProps {
  type: DetailViewType;
  onClose: () => void;
  onOpenAddModal: (t: TransactionType) => void;
}

export const DetailViewModal: React.FC<DetailViewModalProps> = ({
  type,
  onClose,
  onOpenAddModal,
}) => {
  const {
    monthTransactions,
    categories,
    selectedYear,
    selectedMonth,
    deleteTransaction,
  } = useFinance();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  if (!type) return null;

  // Filter transactions of this type for the current month
  const transactionsOfType = monthTransactions.filter((tx) => tx.type === type);
  const totalAmount = transactionsOfType.reduce((acc, tx) => acc + tx.amount, 0);

  // Group by category
  const categoryBreakdown: Record<string, { name: string; icon: string; amount: number }> = {};

  transactionsOfType.forEach((tx) => {
    const cat = categories.find((c) => c.id === tx.category_id);
    const catName = cat ? cat.name : tx.category_name || 'Sin Categoría';
    const catIcon = cat ? cat.icon_or_image_url : tx.category_icon || '💰';

    if (!categoryBreakdown[tx.category_id]) {
      categoryBreakdown[tx.category_id] = { name: catName, icon: catIcon, amount: 0 };
    }
    categoryBreakdown[tx.category_id].amount += tx.amount;
  });

  const breakdownList = Object.entries(categoryBreakdown)
    .map(([id, val]) => ({
      id,
      ...val,
      percentage: totalAmount > 0 ? Math.round((val.amount / totalAmount) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Style configurations
  const config = {
    ingreso: {
      title: 'Detalle de Ingresos',
      badgeText: 'Total Ingresos',
      accentColor: 'text-[#3B4B2E]',
      bgColor: 'bg-[#EBF1E6]',
      borderColor: 'border-[#D3E1CB]',
      barColor: 'bg-[#8E9F7C]',
      iconBg: 'bg-[#EBF1E6] text-[#3B4B2E]',
    },
    gasto: {
      title: 'Detalle de Gastos',
      badgeText: 'Total Gastos',
      accentColor: 'text-[#8B2E2E]',
      bgColor: 'bg-[#FDECE8]',
      borderColor: 'border-[#F5C2BC]',
      barColor: 'bg-[#E06A60]',
      iconBg: 'bg-[#FDECE8] text-[#8B2E2E]',
    },
    ahorro: {
      title: 'Detalle de Ahorros',
      badgeText: 'Total Ahorros',
      accentColor: 'text-[#614E15]',
      bgColor: 'bg-[#FCF6E5]',
      borderColor: 'border-[#F2E4BD]',
      barColor: 'bg-[#E5C86F]',
      iconBg: 'bg-[#FCF6E5] text-[#614E15]',
    },
  }[type];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto overscroll-contain-touch">
        <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border border-[#EDE8DF] shadow-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-slide-up sm:animate-scale-up">
          {/* Header with back button */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b border-[#F0EBE1] shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[#7A7267] hover:bg-[#F5EFE6] transition-colors shrink-0"
                title="Volver"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-[#2D2721] truncate">{config.title}</h2>
                <p className="text-xs text-[#7A7267] truncate">
                  {formatMonthYear(selectedYear, selectedMonth)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenAddModal(type)}
              className="px-3 py-1.5 rounded-xl bg-[#F4EDFA] hover:bg-[#E9DFF2] text-[#9678B6] font-bold text-xs flex items-center gap-1 transition-all shrink-0"
            >
              <Plus size={14} />
              <span>Nuevo</span>
            </button>
          </div>

          {/* Main Month Total Banner */}
          <div className={`px-5 py-3 sm:px-6 sm:py-4 ${config.bgColor} border-b ${config.borderColor} flex items-center justify-between shrink-0`}>
            <div>
              <span className="text-[11px] font-semibold text-[#5A5247] uppercase tracking-wider block">
                {config.badgeText}
              </span>
              <span className={`text-xl sm:text-3xl font-extrabold ${config.accentColor} tabular-nums`}>
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="text-right text-xs text-[#5A5247]">
              <span>{transactionsOfType.length} movimientos</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain-touch px-4 sm:px-6 py-4 space-y-6 min-h-0">
            {/* 1. Category Breakdown */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PieChart size={16} className="text-[#9678B6]" />
                <h3 className="text-xs font-bold text-[#2D2721] uppercase tracking-wider">
                  Desglose por Categoría
                </h3>
              </div>

              {breakdownList.length > 0 ? (
                <div className="space-y-3">
                  {breakdownList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl border border-[#EDE8DF] bg-white shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CategoryIcon iconOrUrl={item.icon} name={item.name} size="sm" />
                          <span className="text-xs font-bold text-[#2D2721]">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-[#2D2721] tabular-nums mr-2">
                            {formatCurrency(item.amount)}
                          </span>
                          <span className="text-[11px] font-bold text-[#7A7267] tabular-nums">
                            ({item.percentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Proportional Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-[#F0EBE1] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${config.barColor} transition-all duration-300`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8E867B] italic text-center py-2">
                  No hay movimientos registrados en este mes.
                </p>
              )}
            </div>

            {/* 2. Full Transactions List for this type */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag size={16} className="text-[#9678B6]" />
                <h3 className="text-xs font-bold text-[#2D2721] uppercase tracking-wider">
                  Lista de Movimientos ({transactionsOfType.length})
                </h3>
              </div>

              <div className="space-y-2">
                {transactionsOfType.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl border border-[#EDE8DF] bg-white hover:border-[#DCD5C9] transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="shrink-0 p-1 rounded-xl bg-[#FAF8F5] border border-[#F0EBE1] flex items-center justify-center">
                        <CategoryIcon
                          iconOrUrl={tx.category_icon || '💰'}
                          name={tx.category_name}
                          size="md"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[#2D2721] truncate">
                            {tx.category_name}
                          </h4>
                          {tx.subcategory && (
                            <span className="text-[10px] text-[#7A7267] bg-[#F5EFE6] px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                              {tx.subcategory}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#8E867B] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {formatDateShort(tx.date)}
                          </span>
                          {tx.note && (
                            <>
                              <span>·</span>
                              <span className="truncate italic max-w-[160px]">{tx.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs sm:text-sm font-extrabold tabular-nums ${config.accentColor}`}>
                        {type === 'gasto' ? `-${formatCurrency(tx.amount)}` : `+${formatCurrency(tx.amount)}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(tx.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9A9184] hover:text-[#8B2E2E] hover:bg-[#FDECE8] transition-colors"
                        title="Eliminar movimiento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {transactionsOfType.length === 0 && (
                  <div className="text-center py-8 text-xs text-[#8E867B]">
                    No hay registros de este tipo en {formatMonthYear(selectedYear, selectedMonth)}.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 bg-[#FAF8F5] border-t border-[#F0EBE1] flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#9678B6] hover:bg-[#8666A6] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Delete Transaction Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="¿Eliminar este movimiento?"
        message="Esta acción no se puede deshacer y actualizará los balances del mes."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          if (deleteTargetId) {
            await deleteTransaction(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  );
};
