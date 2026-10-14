import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { X, Target, Check, AlertCircle } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface BudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetsModal: React.FC<BudgetsModalProps> = ({ isOpen, onClose }) => {
  const { categories, budgets, categorySpendingMap, setCategoryBudget, totalBudgetLimit, totalGastos } =
    useFinance();

  const gastoCategories = categories.filter((c) => c.type === 'gasto');

  // Local state for input values to allow editing limits smoothly
  const [editingLimits, setEditingLimits] = useState<Record<string, string>>({});
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Initialize or get current limit
  const getCategoryLimit = (categoryId: string): number => {
    if (editingLimits[categoryId] !== undefined) {
      return parseFloat(editingLimits[categoryId]) || 0;
    }
    const b = budgets.find((item) => item.category_id === categoryId);
    return b ? b.monthly_limit : 0;
  };

  const handleLimitChange = (categoryId: string, value: string) => {
    setEditingLimits((prev) => ({ ...prev, [categoryId]: value }));
  };

  const handleSaveCategoryLimit = async (categoryId: string) => {
    const rawVal = editingLimits[categoryId];
    const numeric = rawVal !== undefined ? parseFloat(rawVal) || 0 : getCategoryLimit(categoryId);
    await setCategoryBudget(categoryId, numeric);
    setSavedSuccess(categoryId);
    setTimeout(() => {
      setSavedSuccess(null);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto overscroll-contain-touch">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-[#EDE8DF] shadow-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-slide-up sm:animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b border-[#F0EBE1] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#F4EDFA] text-[#9678B6] flex items-center justify-center shrink-0">
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#2D2721]">Presupuestos Mensuales</h2>
              <p className="text-xs text-[#7A7267]">
                Fija límites por categoría para cuidar tus finanzas este mes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7A7267] hover:bg-[#F5EFE6] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Total Budget Summary Header */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-[#FAF8F5] border-b border-[#F0EBE1] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-semibold text-[#8E867B] uppercase tracking-wider block">
              Límite Total Presupuestado
            </span>
            <span className="text-sm sm:text-base font-extrabold text-[#2D2721] tabular-nums">
              {formatCurrency(totalBudgetLimit)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-[#8E867B] uppercase tracking-wider block">
              Gastado este mes
            </span>
            <span className="text-sm sm:text-base font-extrabold text-[#8B2E2E] tabular-nums">
              {formatCurrency(totalGastos)}
            </span>
          </div>
        </div>

        {/* Category Budget List */}
        <div className="flex-1 overflow-y-auto overscroll-contain-touch px-4 sm:px-6 py-4 space-y-4 min-h-0">
          {gastoCategories.map((cat) => {
            const limit = getCategoryLimit(cat.id);
            const spent = categorySpendingMap[cat.id] || 0;
            const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const isOver = limit > 0 && spent > limit;
            const isWarning = limit > 0 && spent >= limit * 0.8 && !isOver;

            let barColor = 'bg-[#8E9F7C]'; // Salvia
            if (isOver) {
              barColor = 'bg-[#E06A60]'; // Coral
            } else if (isWarning) {
              barColor = 'bg-[#E5C86F]'; // Manteca
            }

            return (
              <div
                key={cat.id}
                className="p-4 rounded-2xl border border-[#EDE8DF] bg-white shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0 p-1 rounded-xl bg-[#FAF8F5] border border-[#F0EBE1] flex items-center justify-center">
                      <CategoryIcon
                        iconOrUrl={cat.icon_or_image_url}
                        name={cat.name}
                        size="md"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#2D2721] truncate">{cat.name}</h4>
                      <p className="text-[11px] text-[#7A7267] tabular-nums">
                        Gastado: <strong>{formatCurrency(spent)}</strong>
                        {limit > 0 && ` de ${formatCurrency(limit)}`}
                      </p>
                    </div>
                  </div>

                  {limit > 0 && (
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-lg ${
                          isOver
                            ? 'bg-[#FDECE8] text-[#8B2E2E]'
                            : isWarning
                            ? 'bg-[#FCF6E5] text-[#614E15]'
                            : 'bg-[#EBF1E6] text-[#3B4B2E]'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {limit > 0 && (
                  <div className="w-full h-2 rounded-full bg-[#F0EBE1] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                )}

                {/* Limit input & Save */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 border-t border-[#F5EFE6]">
                  <span className="text-[11px] font-semibold text-[#8E867B] shrink-0">
                    Límite mensual:
                  </span>
                  <div className="relative flex-1 min-w-[120px]">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9A9184]">
                      $
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="Sin límite"
                      value={
                        editingLimits[cat.id] !== undefined
                          ? editingLimits[cat.id]
                          : limit > 0
                          ? limit
                          : ''
                      }
                      onChange={(e) => handleLimitChange(cat.id, e.target.value)}
                      className="w-full pl-6 pr-2.5 py-1.5 rounded-xl border border-[#DDD6C8] text-xs font-medium text-[#2D2721] tabular-nums focus:outline-none focus:border-[#9678B6]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveCategoryLimit(cat.id)}
                    className="px-3 py-1.5 bg-[#F4EDFA] hover:bg-[#E9DFF2] text-[#9678B6] font-bold text-xs rounded-xl border border-[#E9DFF2] transition-colors flex items-center gap-1 shrink-0 ml-auto sm:ml-0"
                  >
                    {savedSuccess === cat.id ? <Check size={13} /> : null}
                    <span>{savedSuccess === cat.id ? 'Guardado' : 'Fijar'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {gastoCategories.length === 0 && (
            <div className="text-center py-8 text-xs text-[#8E867B]">
              No tienes categorías de gasto creadas aún.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-[#FAF8F5] border-t border-[#F0EBE1] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#9678B6] hover:bg-[#8666A6] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
