import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types/finance';
import { getTodayDateString } from '../utils/formatters';
import { X, Calendar, FileText, Check } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'gasto',
}) => {
  const { categories, addTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [customSubcategory, setCustomSubcategory] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Reset or filter categories by selected type
  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setAmountStr('');
      setDate(getTodayDateString());
      setNote('');
      setCustomSubcategory('');
      setError('');
    }
  }, [isOpen, defaultType]);

  // When type changes, auto-select first category of that type
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const firstCat = filteredCategories[0];
      setSelectedCategoryId(firstCat.id);
      setSelectedSubcategory(firstCat.subcategories.length > 0 ? firstCat.subcategories[0] : '');
    } else {
      setSelectedCategoryId('');
      setSelectedSubcategory('');
    }
  }, [type, categories]);

  const currentCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategoryId(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat && cat.subcategories.length > 0) {
      setSelectedSubcategory(cat.subcategories[0]);
    } else {
      setSelectedSubcategory('');
    }
    setCustomSubcategory('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amountStr.replace(/,/g, '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    if (!selectedCategoryId) {
      setError('Por favor selecciona una categoría.');
      return;
    }

    const finalSubcategory = customSubcategory.trim() || selectedSubcategory || '';

    try {
      setIsSubmitting(true);
      await addTransaction({
        type,
        category_id: selectedCategoryId,
        subcategory: finalSubcategory,
        amount: numericAmount,
        date: date || getTodayDateString(),
        note: note.trim(),
      });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar el movimiento. Intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/35 backdrop-blur-xs">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-[#EDE8DF] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up sm:animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F0EBE1]">
          <h2 className="text-lg font-bold text-[#2D2721]">Nuevo Movimiento</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7A7267] hover:bg-[#F5EFE6] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* 1. Type Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#F5EFE6] rounded-2xl">
            <button
              type="button"
              onClick={() => setType('gasto')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'gasto'
                  ? 'bg-[#FDECE8] text-[#8B2E2E] border border-[#F5C2BC] shadow-2xs'
                  : 'text-[#7A7267] hover:text-[#2D2721]'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('ingreso')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'ingreso'
                  ? 'bg-[#EBF1E6] text-[#3B4B2E] border border-[#D3E1CB] shadow-2xs'
                  : 'text-[#7A7267] hover:text-[#2D2721]'
              }`}
            >
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => setType('ahorro')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'ahorro'
                  ? 'bg-[#FCF6E5] text-[#614E15] border border-[#F2E4BD] shadow-2xs'
                  : 'text-[#7A7267] hover:text-[#2D2721]'
              }`}
            >
              Ahorro
            </button>
          </div>

          {/* 2. Amount Input */}
          <div className="bg-[#FAF8F5] rounded-2xl border border-[#EDE8DF] p-4 text-center">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E867B] mb-1">
              Monto
            </label>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-[#5A5247]">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                autoFocus
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-48 text-3xl sm:text-4xl font-extrabold text-[#2D2721] tabular-nums bg-transparent text-center focus:outline-none placeholder-[#C7BFB3]"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-[#8B2E2E] text-center bg-[#FDECE8] py-2 px-3 rounded-xl border border-[#F5C2BC]">
              {error}
            </p>
          )}

          {/* 3. Categories Grid */}
          <div>
            <label className="block text-xs font-semibold text-[#5A5247] mb-2">
              Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#9678B6] bg-[#F4EDFA] text-[#2D2721] shadow-2xs'
                        : 'border-[#EDE8DF] bg-white text-[#5A5247] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className="text-xl shrink-0">{cat.icon_or_image_url}</span>
                    <span className="text-xs font-semibold truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
            {filteredCategories.length === 0 && (
              <p className="text-xs text-[#8E867B] italic text-center py-3">
                No hay categorías de este tipo. Puedes crearlas en el botón "Categorías".
              </p>
            )}
          </div>

          {/* 4. Subcategory Chips / Selection */}
          {currentCategory && (
            <div>
              <label className="block text-xs font-semibold text-[#5A5247] mb-2">
                Subcategoría
              </label>
              {currentCategory.subcategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {currentCategory.subcategories.map((sub) => {
                    const isSelected = selectedSubcategory === sub && !customSubcategory;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          setSelectedSubcategory(sub);
                          setCustomSubcategory('');
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-[#9678B6] text-white border-[#9678B6] shadow-2xs'
                            : 'bg-white text-[#5A5247] border-[#EDE8DF] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Custom subcategory input */}
              <input
                type="text"
                placeholder="O escribe una subcategoría personalizada..."
                value={customSubcategory}
                onChange={(e) => setCustomSubcategory(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#DDD6C8] bg-white text-[#2D2721] focus:outline-none focus:border-[#9678B6] focus:ring-1 focus:ring-[#9678B6]"
              />
            </div>
          )}

          {/* 5. Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5A5247] mb-1.5">
                Fecha
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9184]" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDD6C8] bg-white text-xs text-[#2D2721] focus:outline-none focus:border-[#9678B6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A5247] mb-1.5">
                Nota opcional
              </label>
              <div className="relative">
                <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9184]" />
                <input
                  type="text"
                  placeholder="Detalle o comercio..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDD6C8] bg-white text-xs text-[#2D2721] focus:outline-none focus:border-[#9678B6]"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#F0EBE1]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#7A7267] hover:bg-[#F5EFE6] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#9678B6] hover:bg-[#8666A6] active:bg-[#785996] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Movimiento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
