import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { FilterTab, DetailViewType, TransactionType } from '../types/finance';
import { formatCurrency, formatDateShort, formatMonthYear } from '../utils/formatters';
import { TransactionModal } from './TransactionModal';
import { CategoriesModal } from './CategoriesModal';
import { BudgetsModal } from './BudgetsModal';
import { DetailViewModal } from './DetailViewModal';
import { ConfirmModal } from './ConfirmModal';
import {
  Wallet,
  ChevronLeft,
  ChevronRight,
  Plus,
  Lock,
  Tag,
  Target,
  Search,
  Trash2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  TrendingUp,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, lockApp, signOutUser } = useAuth();
  const {
    selectedYear,
    selectedMonth,
    nextMonth,
    prevMonth,
    goToCurrentMonth,
    monthTransactions,
    totalIngresos,
    totalGastos,
    totalAhorros,
    balanceAcumulado,
    totalBudgetLimit,
    budgetSpentPercentage,
    deleteTransaction,
  } = useFinance();

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [defaultTxType, setDefaultTxType] = useState<TransactionType>('gasto');
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isBudgetsModalOpen, setIsBudgetsModalOpen] = useState(false);
  const [detailView, setDetailView] = useState<DetailViewType>(null);
  const [deleteTargetTxId, setDeleteTargetTxId] = useState<string | null>(null);

  // Filters state
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if viewing current real-world month
  const today = new Date();
  const isCurrentMonth =
    selectedYear === today.getFullYear() && selectedMonth === today.getMonth();

  // Filtered transactions for recent list
  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter((tx) => {
      // 1. Tab filter
      if (activeTab !== 'all' && tx.type !== activeTab) {
        return false;
      }
      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCat = (tx.category_name || '').toLowerCase().includes(q);
        const matchesSub = (tx.subcategory || '').toLowerCase().includes(q);
        const matchesNote = (tx.note || '').toLowerCase().includes(q);
        const matchesAmount = tx.amount.toString().includes(q);
        if (!matchesCat && !matchesSub && !matchesNote && !matchesAmount) {
          return false;
        }
      }
      return true;
    });
  }, [monthTransactions, activeTab, searchQuery]);

  const handleOpenAddTx = (type: TransactionType = 'gasto') => {
    setDefaultTxType(type);
    setIsTxModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 sm:pb-16 text-[#2D2721]">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EDE8DF]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDFA] border border-[#E9DFF2] text-[#9678B6] flex items-center justify-center shadow-2xs">
              <Wallet size={18} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[#2D2721] flex items-center gap-1.5">
                <span>Mis Finanzas</span>
              </h1>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsCategoriesModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#EDE8DF] bg-white hover:bg-[#F9F7F3] text-xs font-semibold text-[#5A5247] shadow-2xs flex items-center gap-1.5 transition-all"
              title="Administrar Categorías"
            >
              <Tag size={14} className="text-[#9678B6]" />
              <span className="hidden sm:inline">Categorías</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBudgetsModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#EDE8DF] bg-white hover:bg-[#F9F7F3] text-xs font-semibold text-[#5A5247] shadow-2xs flex items-center gap-1.5 transition-all"
              title="Administrar Presupuestos"
            >
              <Target size={14} className="text-[#9678B6]" />
              <span className="hidden sm:inline">Presupuestos</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddTx('gasto')}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#9678B6] hover:bg-[#8666A6] active:bg-[#785996] text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-all"
            >
              <Plus size={15} />
              <span className="hidden xs:inline">Nuevo</span>
            </button>

            {/* Lock with PIN button */}
            <button
              type="button"
              onClick={lockApp}
              className="w-9 h-9 rounded-xl border border-[#EDE8DF] bg-white hover:bg-[#F4EDFA] text-[#7A7267] hover:text-[#9678B6] flex items-center justify-center shadow-2xs transition-colors"
              title="Bloquear con PIN"
            >
              <Lock size={15} />
            </button>

            {/* User logout action */}
            <button
              type="button"
              onClick={signOutUser}
              className="w-9 h-9 rounded-xl border border-[#EDE8DF] bg-white hover:bg-[#FDECE8] text-[#7A7267] hover:text-[#8B2E2E] flex items-center justify-center shadow-2xs transition-colors"
              title={`Cerrar sesión (${user?.email || ''})`}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* 2. MONTH SELECTOR */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-[#EDE8DF] p-2.5 px-3.5 shadow-2xs">
          <button
            type="button"
            onClick={prevMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#7A7267] hover:bg-[#F5EFE6] transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-[#2D2721] capitalize tracking-tight">
              {formatMonthYear(selectedYear, selectedMonth)}
            </h2>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={goToCurrentMonth}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F4EDFA] text-[#9678B6] hover:bg-[#E9DFF2] transition-colors"
              >
                Volver a Hoy
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#7A7267] hover:bg-[#F5EFE6] transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* 3. MAIN BALANCE CARD */}
        <div className="bg-white rounded-3xl border border-[#EDE8DF] p-6 sm:p-7 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7267] flex items-center gap-1.5">
                <TrendingUp size={15} className="text-[#9678B6]" />
                Balance Acumulado del Mes
              </span>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#2D2721] tabular-nums tracking-tight">
                  {formatCurrency(balanceAcumulado)}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                    balanceAcumulado >= 0
                      ? 'bg-[#EBF1E6] text-[#3B4B2E]'
                      : 'bg-[#FDECE8] text-[#8B2E2E]'
                  }`}
                >
                  {balanceAcumulado >= 0 ? 'Superávit' : 'Déficit'}
                </span>
              </div>
              <p className="text-[11px] text-[#8E867B] mt-1.5">
                Cálculo del mes: Ingresos ({formatCurrency(totalIngresos)}) - Gastos ({formatCurrency(totalGastos)})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAddTx('gasto')}
                className="px-3.5 py-2 rounded-xl bg-[#FDECE8] text-[#8B2E2E] hover:bg-[#FAD9D3] text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Gasto</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddTx('ingreso')}
                className="px-3.5 py-2 rounded-xl bg-[#EBF1E6] text-[#3B4B2E] hover:bg-[#E0EBD8] text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Ingreso</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddTx('ahorro')}
                className="px-3.5 py-2 rounded-xl bg-[#FCF6E5] text-[#614E15] hover:bg-[#F8EFCF] text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Ahorro</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. THREE FINANCIAL SUMMARY CARDS (INTERACTIVE) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Ingresos Card */}
          <div
            onClick={() => setDetailView('ingreso')}
            role="button"
            tabIndex={0}
            className="bg-white rounded-3xl border border-[#EDE8DF] p-5 shadow-2xs hover:border-[#D3E1CB] hover:shadow-xs transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-2xl bg-[#EBF1E6] text-[#3B4B2E] flex items-center justify-center">
                <ArrowUpRight size={18} />
              </div>
              <span className="text-[11px] font-semibold text-[#8E867B] group-hover:text-[#3B4B2E] transition-colors flex items-center gap-0.5">
                Ver detalle →
              </span>
            </div>
            <span className="text-xs font-semibold text-[#7A7267] block">Ingresos del Mes</span>
            <div className="text-2xl font-extrabold text-[#3B4B2E] tabular-nums mt-1">
              +{formatCurrency(totalIngresos)}
            </div>
          </div>

          {/* Gastos Card */}
          <div
            onClick={() => setDetailView('gasto')}
            role="button"
            tabIndex={0}
            className="bg-white rounded-3xl border border-[#EDE8DF] p-5 shadow-2xs hover:border-[#F5C2BC] hover:shadow-xs transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-2xl bg-[#FDECE8] text-[#8B2E2E] flex items-center justify-center">
                <ArrowDownRight size={18} />
              </div>
              <span className="text-[11px] font-semibold text-[#8E867B] group-hover:text-[#8B2E2E] transition-colors flex items-center gap-0.5">
                Ver detalle →
              </span>
            </div>
            <span className="text-xs font-semibold text-[#7A7267] block">Gastos del Mes</span>
            <div className="text-2xl font-extrabold text-[#8B2E2E] tabular-nums mt-1">
              -{formatCurrency(totalGastos)}
            </div>
          </div>

          {/* Ahorros Card */}
          <div
            onClick={() => setDetailView('ahorro')}
            role="button"
            tabIndex={0}
            className="bg-white rounded-3xl border border-[#EDE8DF] p-5 shadow-2xs hover:border-[#F2E4BD] hover:shadow-xs transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-2xl bg-[#FCF6E5] text-[#614E15] flex items-center justify-center">
                <PiggyBank size={18} />
              </div>
              <span className="text-[11px] font-semibold text-[#8E867B] group-hover:text-[#614E15] transition-colors flex items-center gap-0.5">
                Ver detalle →
              </span>
            </div>
            <span className="text-xs font-semibold text-[#7A7267] block">Ahorros del Mes</span>
            <div className="text-2xl font-extrabold text-[#614E15] tabular-nums mt-1">
              {formatCurrency(totalAhorros)}
            </div>
          </div>
        </div>

        {/* 5. MONTHLY BUDGET TRACKING BAR */}
        <div className="bg-white rounded-3xl border border-[#EDE8DF] p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#9678B6]" />
              <h3 className="text-xs font-bold text-[#2D2721] uppercase tracking-wider">
                Presupuesto Mensual
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {totalBudgetLimit > 0 ? (
                <span className="text-xs text-[#7A7267] tabular-nums">
                  <strong className="text-[#2D2721]">{formatCurrency(totalGastos)}</strong> de{' '}
                  {formatCurrency(totalBudgetLimit)} ({budgetSpentPercentage}%)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsBudgetsModalOpen(true)}
                  className="text-xs font-bold text-[#9678B6] hover:underline"
                >
                  Fijar límites de gasto
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 rounded-full bg-[#F0EBE1] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                budgetSpentPercentage > 100
                  ? 'bg-[#E06A60]'
                  : budgetSpentPercentage > 85
                  ? 'bg-[#E5C86F]'
                  : 'bg-[#9678B6]'
              }`}
              style={{ width: `${Math.min(budgetSpentPercentage, 100)}%` }}
            />
          </div>

          {totalBudgetLimit > 0 && (
            <div className="flex items-center justify-between text-[11px] text-[#8E867B] mt-2">
              <span>0%</span>
              <span>
                {budgetSpentPercentage > 100
                  ? `Excedido por ${formatCurrency(totalGastos - totalBudgetLimit)}`
                  : `Disponible: ${formatCurrency(Math.max(0, totalBudgetLimit - totalGastos))}`}
              </span>
              <span>100%</span>
            </div>
          )}
        </div>

        {/* 6. RECENT TRANSACTIONS SECTION */}
        <div className="bg-white rounded-3xl border border-[#EDE8DF] p-5 sm:p-6 shadow-2xs">
          {/* Header with Title & Live Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-[#2D2721]">Movimientos Recientes</h3>
              <p className="text-xs text-[#7A7267]">
                Registros de {formatMonthYear(selectedYear, selectedMonth)}
              </p>
            </div>

            {/* Live Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9184]"
              />
              <input
                type="text"
                placeholder="Buscar movimientos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#DDD6C8] bg-white text-xs text-[#2D2721] focus:outline-none focus:border-[#9678B6]"
              />
            </div>
          </div>

          {/* Interactive Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F5EFE6] rounded-2xl mb-4 max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-[#2D2721] shadow-2xs'
                  : 'text-[#7A7267] hover:text-[#2D2721]'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gasto')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'gasto'
                  ? 'bg-[#FDECE8] text-[#8B2E2E] shadow-2xs'
                  : 'text-[#7A7267] hover:text-[#2D2721]'
              }`}
            >
              Gastos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ingreso')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'ingreso'
                  ? 'bg-[#EBF1E6] text-[#3B4B2E] shadow-2xs'
                  : 'text-[#7A7267] hover:text-[#2D2721]'
              }`}
            >
              Ingresos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ahorro')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'ahorro'
                  ? 'bg-[#FCF6E5] text-[#614E15] shadow-2xs'
                  : 'text-[#7A7267] hover:text-[#2D2721]'
              }`}
            >
              Ahorros
            </button>
          </div>

          {/* Transaction Rows */}
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => {
              const isGasto = tx.type === 'gasto';
              const isIngreso = tx.type === 'ingreso';

              let amountColor = 'text-[#614E15]'; // ahorro
              let sign = '';
              if (isGasto) {
                amountColor = 'text-[#8B2E2E]';
                sign = '-';
              } else if (isIngreso) {
                amountColor = 'text-[#3B4B2E]';
                sign = '+';
              }

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl border border-[#EDE8DF] bg-white hover:border-[#DCD5C9] transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl p-1.5 rounded-xl bg-[#FAF8F5] shrink-0 border border-[#F0EBE1]">
                      {tx.category_icon || '💰'}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-[#2D2721] truncate">
                          {tx.category_name}
                        </h4>
                        {tx.subcategory && (
                          <span className="text-[10px] text-[#7A7267] bg-[#F5EFE6] px-2 py-0.5 rounded-md truncate max-w-[140px]">
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
                            <span className="truncate italic max-w-[180px]">{tx.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs sm:text-sm font-extrabold tabular-nums ${amountColor}`}>
                      {sign}
                      {formatCurrency(tx.amount)}
                    </span>

                    <button
                      type="button"
                      onClick={() => setDeleteTargetTxId(tx.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9A9184] hover:text-[#8B2E2E] hover:bg-[#FDECE8] transition-colors"
                      title="Eliminar movimiento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12 text-[#8E867B]">
                <p className="text-xs">No hay movimientos en este mes para el filtro actual.</p>
                <button
                  type="button"
                  onClick={() => handleOpenAddTx('gasto')}
                  className="mt-2 text-xs font-bold text-[#9678B6] hover:underline"
                >
                  + Agregar primer movimiento
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 7. FLOATING ACTION BUTTON (FAB) FOR MOBILE */}
      <button
        type="button"
        onClick={() => handleOpenAddTx('gasto')}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[#9678B6] hover:bg-[#8666A6] active:bg-[#785996] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9678B6]/30"
        title="Agregar nuevo movimiento"
      >
        <Plus size={26} />
      </button>

      {/* ALL MODALS */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        defaultType={defaultTxType}
      />

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />

      <BudgetsModal
        isOpen={isBudgetsModalOpen}
        onClose={() => setIsBudgetsModalOpen(false)}
      />

      <DetailViewModal
        type={detailView}
        onClose={() => setDetailView(null)}
        onOpenAddModal={(t) => {
          setDetailView(null);
          handleOpenAddTx(t);
        }}
      />

      <ConfirmModal
        isOpen={deleteTargetTxId !== null}
        title="¿Eliminar este movimiento?"
        message="¿Estás seguro de que deseas eliminar este registro? Esta acción actualizará los balances del mes."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          if (deleteTargetTxId) {
            await deleteTransaction(deleteTargetTxId);
            setDeleteTargetTxId(null);
          }
        }}
        onCancel={() => setDeleteTargetTxId(null)}
      />
    </div>
  );
};
