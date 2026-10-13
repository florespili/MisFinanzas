import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { AuthScreen } from './components/AuthScreen';
import { PinScreen } from './components/PinScreen';
import { Dashboard } from './components/Dashboard';
import { testConnection } from './firebase/config';
import { Wallet } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading, isLocked, pinLoading } = useAuth();

  useEffect(() => {
    testConnection();
  }, []);

  if (loading || pinLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-[#F4EDFA] border border-[#E9DFF2] text-[#9678B6] flex items-center justify-center shadow-2xs animate-pulse mb-3">
          <Wallet size={24} />
        </div>
        <h2 className="text-sm font-bold text-[#2D2721]">Mis Finanzas</h2>
        <p className="text-xs text-[#7A7267] mt-1">Cargando tus datos seguros...</p>
      </div>
    );
  }

  // If not authenticated to Firebase yet
  if (!user) {
    return <AuthScreen />;
  }

  // If authenticated but app is locked by PIN (or creating PIN for the first time)
  if (isLocked) {
    return <PinScreen />;
  }

  // Main Dashboard
  return (
    <FinanceProvider>
      <Dashboard />
    </FinanceProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
