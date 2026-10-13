import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Delete, RotateCcw, ShieldCheck, LogOut } from 'lucide-react';

export const PinScreen: React.FC = () => {
  const { hasPinSet, unlockWithPin, setNewPin, signOutUser, user } = useAuth();

  // Mode: if !hasPinSet, setup mode ('create' -> 'confirm'). Otherwise 'unlock'.
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState<string>('');
  const [currentInput, setCurrentInput] = useState<string>('');
  const [errorShake, setErrorShake] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleDigit = useCallback(
    (digit: string) => {
      if (currentInput.length >= 4 || isVerifying) return;
      const next = currentInput + digit;
      setCurrentInput(next);
      setErrorMessage('');
    },
    [currentInput, isVerifying]
  );

  const handleDelete = useCallback(() => {
    if (isVerifying) return;
    setCurrentInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  }, [isVerifying]);

  const handleClear = useCallback(() => {
    if (isVerifying) return;
    setCurrentInput('');
    setErrorMessage('');
  }, [isVerifying]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear]);

  // Check PIN when 4 digits entered
  useEffect(() => {
    if (currentInput.length !== 4) return;

    const processPin = async () => {
      setIsVerifying(true);

      if (!hasPinSet) {
        // Setup flow
        if (setupStep === 'create') {
          setFirstPin(currentInput);
          setCurrentInput('');
          setSetupStep('confirm');
          setIsVerifying(false);
        } else {
          // Confirm step
          if (currentInput === firstPin) {
            await setNewPin(currentInput);
            setIsVerifying(false);
          } else {
            // Mismatch
            triggerError('Los PINs no coinciden. Intenta de nuevo.');
            setCurrentInput('');
            setSetupStep('create');
            setFirstPin('');
            setIsVerifying(false);
          }
        }
      } else {
        // Unlock flow
        const success = await unlockWithPin(currentInput);
        if (!success) {
          triggerError('PIN incorrecto. Intenta nuevamente.');
          setCurrentInput('');
          setIsVerifying(false);
        } else {
          setIsVerifying(false);
        }
      }
    };

    processPin();
  }, [currentInput, hasPinSet, setupStep, firstPin, unlockWithPin, setNewPin]);

  const triggerError = (msg: string) => {
    setErrorShake(true);
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorShake(false);
    }, 500);
  };

  const getTitle = () => {
    if (!hasPinSet) {
      return setupStep === 'create' ? 'Crea tu PIN de 4 dígitos' : 'Confirma tu nuevo PIN';
    }
    return 'Ingresa tu PIN de seguridad';
  };

  const getSubtitle = () => {
    if (!hasPinSet) {
      return setupStep === 'create'
        ? 'Elige un código de 4 números para acceder rápidamente a tu cuenta.'
        : 'Vuelve a escribir los 4 dígitos para asegurarte de que sea correcto.';
    }
    return 'Tus finanzas personales están protegidas de forma privada.';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF8F5] p-4 select-none">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Top security icon badge */}
        <div className="w-14 h-14 rounded-2xl bg-[#F4EDFA] border border-[#E9DFF2] flex items-center justify-center text-[#9678B6] mb-5 shadow-2xs">
          {!hasPinSet ? <ShieldCheck size={28} /> : <Lock size={26} />}
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-xl font-bold text-[#2D2721] text-center tracking-tight mb-1.5">
          {getTitle()}
        </h1>
        <p className="text-xs text-[#7A7267] text-center max-w-xs mb-7 leading-relaxed">
          {getSubtitle()}
        </p>

        {/* 4 PIN Dots */}
        <div
          className={`flex items-center justify-center gap-4 mb-3 transition-transform ${
            errorShake ? 'animate-shake' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = currentInput.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-[#9678B6] scale-110 shadow-xs'
                    : 'bg-white border-2 border-[#D8D1C5]'
                }`}
              />
            );
          })}
        </div>

        {/* Error message slot (reserved height to avoid layout shift) */}
        <div className="h-6 flex items-center justify-center mb-4">
          {errorMessage && (
            <span className="text-xs font-semibold text-[#8B2E2E] animate-fade-in">
              {errorMessage}
            </span>
          )}
        </div>

        {/* Tactile Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3.5 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              disabled={isVerifying}
              className="h-15 rounded-2xl bg-white border border-[#EDE8DF] text-xl font-semibold text-[#2D2721] tabular-nums shadow-2xs hover:bg-[#F9F7F3] active:bg-[#F1ECE3] active:scale-95 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9678B6]"
            >
              {digit}
            </button>
          ))}

          {/* Clear button (C) */}
          <button
            type="button"
            onClick={handleClear}
            disabled={isVerifying || currentInput.length === 0}
            className="h-15 rounded-2xl bg-white/70 border border-[#EDE8DF] text-sm font-semibold text-[#7A7267] shadow-2xs hover:bg-white hover:text-[#2D2721] active:scale-95 transition-all flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9678B6] disabled:opacity-40"
            title="Limpiar código"
          >
            <RotateCcw size={16} />
            <span className="text-xs">C</span>
          </button>

          {/* Digit 0 */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            disabled={isVerifying}
            className="h-15 rounded-2xl bg-white border border-[#EDE8DF] text-xl font-semibold text-[#2D2721] tabular-nums shadow-2xs hover:bg-[#F9F7F3] active:bg-[#F1ECE3] active:scale-95 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9678B6]"
          >
            0
          </button>

          {/* Delete button (⌫) */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isVerifying || currentInput.length === 0}
            className="h-15 rounded-2xl bg-white/70 border border-[#EDE8DF] text-[#7A7267] shadow-2xs hover:bg-white hover:text-[#2D2721] active:scale-95 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9678B6] disabled:opacity-40"
            title="Borrar último dígito"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Footer info: user email & logout escape hatch */}
        <div className="mt-8 flex flex-col items-center gap-2">
          {user && (
            <p className="text-[11px] text-[#8E867B] truncate max-w-xs">
              Conectado como <span className="font-medium text-[#5A5247]">{user.email || 'Usuario'}</span>
            </p>
          )}

          <button
            type="button"
            onClick={signOutUser}
            className="flex items-center gap-1.5 text-xs font-medium text-[#7A7267] hover:text-[#8B2E2E] transition-colors py-1 px-3 rounded-lg hover:bg-[#F5EFE6]"
          >
            <LogOut size={13} />
            Cerrar sesión / Cambiar cuenta
          </button>
        </div>
      </div>
    </div>
  );
};
