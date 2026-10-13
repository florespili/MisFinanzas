import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from './AuthContext';
import { Transaction, Category, Budget, TransactionType } from '../types/finance';
import { INITIAL_CATEGORIES } from '../data/defaultCategories';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  loading: boolean;
  selectedYear: number;
  selectedMonth: number; // 0 to 11
  setSelectedYear: (y: number) => void;
  setSelectedMonth: (m: number) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  goToCurrentMonth: () => void;
  // Mutations
  addTransaction: (data: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (data: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setCategoryBudget: (categoryId: string, monthlyLimit: number) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  // Computed for selected month
  monthTransactions: Transaction[];
  totalIngresos: number;
  totalGastos: number;
  totalAhorros: number;
  balanceAcumulado: number;
  totalBudgetLimit: number;
  budgetSpentPercentage: number;
  categorySpendingMap: Record<string, number>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Default to today's month & year
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());

  // Firestore listeners
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCategories([]);
      setBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userId = user.uid;

    // 1. Categories
    const categoriesRef = collection(db, 'users', userId, 'categories');
    const unsubCategories = onSnapshot(
      categoriesRef,
      async (snapshot) => {
        const loadedCats: Category[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedCats.push({
            id: docSnap.id,
            type: data.type,
            name: data.name,
            icon_or_image_url: data.icon_or_image_url || '💰',
            subcategories: Array.isArray(data.subcategories) ? data.subcategories : [],
            created_at: data.created_at,
            user_id: userId,
          });
        });

        // Always update categories state with actual snapshot data
        setCategories(loadedCats);

        // One-time initial seeding for brand new users only
        if (loadedCats.length === 0 && !snapshot.metadata.hasPendingWrites) {
          const localInitKey = `cat_seeded_${userId}`;
          const isLocallyInit = localStorage.getItem(localInitKey) === 'true';

          if (!isLocallyInit) {
            try {
              const initDocRef = doc(db, 'users', userId, 'config', 'init');
              const initSnap = await getDoc(initDocRef);
              const alreadySeeded = initSnap.exists() && initSnap.data()?.categories_seeded === true;

              if (!alreadySeeded) {
                // First time ever: seed defaults and mark as initialized
                const batch = writeBatch(db);
                INITIAL_CATEGORIES.forEach((cat) => {
                  const newDocRef = doc(collection(db, 'users', userId, 'categories'));
                  batch.set(newDocRef, {
                    ...cat,
                    created_at: new Date().toISOString(),
                    user_id: userId,
                  });
                });
                batch.set(initDocRef, {
                  categories_seeded: true,
                  seeded_at: new Date().toISOString(),
                });
                await batch.commit();
                localStorage.setItem(localInitKey, 'true');
              } else {
                // User already initialized in the past and intentionally has 0 categories
                localStorage.setItem(localInitKey, 'true');
              }
            } catch (e) {
              console.warn('Could not check or seed default categories:', e);
            }
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/categories`);
      }
    );

    // 2. Transactions
    const txRef = collection(db, 'users', userId, 'transactions');
    const unsubTx = onSnapshot(
      txRef,
      (snapshot) => {
        const loadedTx: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedTx.push({
            id: docSnap.id,
            type: data.type,
            category_id: data.category_id,
            subcategory: data.subcategory || '',
            amount: Number(data.amount) || 0,
            date: data.date,
            note: data.note || '',
            created_at: data.created_at || new Date().toISOString(),
            user_id: userId,
          });
        });
        // Sort descending by date, then created_at
        loadedTx.sort((a, b) => {
          const dComp = b.date.localeCompare(a.date);
          return dComp !== 0 ? dComp : (b.created_at || '').localeCompare(a.created_at || '');
        });
        setTransactions(loadedTx);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/transactions`);
      }
    );

    // 3. Budgets
    const budgetsRef = collection(db, 'users', userId, 'budgets');
    const unsubBudgets = onSnapshot(
      budgetsRef,
      (snapshot) => {
        const loadedBudgets: Budget[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedBudgets.push({
            id: docSnap.id,
            category_id: data.category_id,
            monthly_limit: Number(data.monthly_limit) || 0,
            created_at: data.created_at,
            user_id: userId,
          });
        });
        setBudgets(loadedBudgets);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/budgets`);
      }
    );

    return () => {
      unsubCategories();
      unsubTx();
      unsubBudgets();
    };
  }, [user]);

  // Month navigation helpers
  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  // Enriched categories lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Transactions for current month
  const monthTransactions = useMemo(() => {
    const targetMonthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    return transactions
      .filter((tx) => tx.date && tx.date.startsWith(targetMonthPrefix))
      .map((tx) => {
        const cat = categoryMap.get(tx.category_id);
        return {
          ...tx,
          category_name: cat ? cat.name : tx.category_id,
          category_icon: cat ? cat.icon_or_image_url : '💰',
        };
      });
  }, [transactions, selectedYear, selectedMonth, categoryMap]);

  // Totals
  const { totalIngresos, totalGastos, totalAhorros, categorySpendingMap } = useMemo(() => {
    let ingresos = 0;
    let gastos = 0;
    let ahorros = 0;
    const spendingMap: Record<string, number> = {};

    monthTransactions.forEach((tx) => {
      if (tx.type === 'ingreso') {
        ingresos += tx.amount;
      } else if (tx.type === 'gasto') {
        gastos += tx.amount;
        spendingMap[tx.category_id] = (spendingMap[tx.category_id] || 0) + tx.amount;
      } else if (tx.type === 'ahorro') {
        ahorros += tx.amount;
      }
    });

    return {
      totalIngresos: ingresos,
      totalGastos: gastos,
      totalAhorros: ahorros,
      categorySpendingMap: spendingMap,
    };
  }, [monthTransactions]);

  const balanceAcumulado = totalIngresos - totalGastos;

  // Budget calculations
  const totalBudgetLimit = useMemo(() => {
    return budgets.reduce((sum, b) => sum + (Number(b.monthly_limit) || 0), 0);
  }, [budgets]);

  const budgetSpentPercentage = useMemo(() => {
    if (totalBudgetLimit <= 0) return 0;
    return Math.min(Math.round((totalGastos / totalBudgetLimit) * 100), 100);
  }, [totalGastos, totalBudgetLimit]);

  // Mutations
  const addTransaction = async (data: Omit<Transaction, 'id' | 'created_at'>) => {
    if (!user) return;
    try {
      const txCollectionRef = collection(db, 'users', user.uid, 'transactions');
      await addDoc(txCollectionRef, {
        ...data,
        created_at: new Date().toISOString(),
        user_id: user.uid,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/transactions`);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'transactions', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/transactions/${id}`);
    }
  };

  const addCategory = async (data: Omit<Category, 'id'>) => {
    if (!user) return;
    localStorage.setItem(`cat_seeded_${user.uid}`, 'true');
    try {
      const catCollectionRef = collection(db, 'users', user.uid, 'categories');
      const docRef = await addDoc(catCollectionRef, {
        ...data,
        created_at: new Date().toISOString(),
        user_id: user.uid,
      });
      setCategories((prev) => [...prev, { id: docRef.id, ...data, user_id: user.uid }]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/categories`);
    }
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    if (!user) return;
    localStorage.setItem(`cat_seeded_${user.uid}`, 'true');
    try {
      const docRef = doc(db, 'users', user.uid, 'categories', id);
      await updateDoc(docRef, data);
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    localStorage.setItem(`cat_seeded_${user.uid}`, 'true');
    try {
      const docRef = doc(db, 'users', user.uid, 'categories', id);
      await deleteDoc(docRef);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/categories/${id}`);
    }
  };

  const setCategoryBudget = async (categoryId: string, monthlyLimit: number) => {
    if (!user) return;
    try {
      // Find if budget already exists for this category
      const existing = budgets.find((b) => b.category_id === categoryId);
      if (existing) {
        const docRef = doc(db, 'users', user.uid, 'budgets', existing.id);
        await updateDoc(docRef, { monthly_limit: monthlyLimit });
      } else {
        const docRef = collection(db, 'users', user.uid, 'budgets');
        await addDoc(docRef, {
          category_id: categoryId,
          monthly_limit: monthlyLimit,
          created_at: new Date().toISOString(),
          user_id: user.uid,
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/budgets`);
    }
  };

  const deleteBudget = async (budgetId: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'budgets', budgetId);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/budgets/${budgetId}`);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        budgets,
        loading,
        selectedYear,
        selectedMonth,
        setSelectedYear,
        setSelectedMonth,
        nextMonth,
        prevMonth,
        goToCurrentMonth,
        addTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        setCategoryBudget,
        deleteBudget,
        monthTransactions,
        totalIngresos,
        totalGastos,
        totalAhorros,
        balanceAcumulado,
        totalBudgetLimit,
        budgetSpentPercentage,
        categorySpendingMap,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
