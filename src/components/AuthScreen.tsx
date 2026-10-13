import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      const fbError = err as { code?: string; message?: string };
      const errorCode = fbError?.code || '';
      const errorMessage = fbError?.message || (err instanceof Error ? err.message : String(err));

      console.error('🔥 [Firebase Google Auth Error]:', {
        code: errorCode,
        message: errorMessage,
        hostname: window.location.hostname,
        origin: window.location.origin,
        fullError: err,
      });

      if (errorCode === 'auth/unauthorized-domain') {
        setError(
          `Dominio no autorizado (auth/unauthorized-domain): El dominio "${window.location.hostname}" no está en la lista de dominios autorizados en Firebase (spartan-impact-9xtlg). Debes agregarlo en Firebase Console > Authentication > Settings > Authorized domains.`
        );
      } else if (errorCode === 'auth/popup-blocked') {
        setError(
          'Ventana emergente bloqueada (auth/popup-blocked): El navegador bloqueó la ventana de Google. Por favor permite los popups para este sitio.'
        );
      } else if (errorCode === 'auth/popup-closed-by-user') {
        setError(
          'Inicio cancelado (auth/popup-closed-by-user): Se cerró la ventana de Google antes de finalizar.'
        );
      } else if (errorCode === 'auth/cancelled-popup-request') {
        setError(
          'Solicitud cancelada (auth/cancelled-popup-request): Ya había otra ventana de inicio de sesión en curso.'
        );
      } else if (errorCode === 'auth/operation-not-allowed') {
        setError(
          'Proveedor no habilitado (auth/operation-not-allowed): El proveedor de Google no está habilitado en Firebase.'
        );
      } else if (errorCode === 'auth/network-request-failed') {
        setError(
          'Error de red (auth/network-request-failed): No se pudo conectar con Firebase. Revisa tu conexión a internet.'
        );
      } else {
        setError(`Error al iniciar sesión con Google [${errorCode || 'error'}]: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Email o contraseña incorrectos.');
      } else if (msg.includes('email-already-in-use')) {
        setError('Este correo electrónico ya está registrado. Elige "Iniciar Sesión".');
      } else if (msg.includes('invalid-email')) {
        setError('El formato del correo electrónico no es válido.');
      } else {
        setError('Ocurrió un error al procesar tu solicitud. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F5] flex flex-col items-center justify-center p-4 sm:p-6 py-8 overflow-y-auto overscroll-contain-touch">
      <div className="w-full max-w-md my-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F4EDFA] border border-[#E9DFF2] text-[#9678B6] mb-3 shadow-2xs">
            <Wallet size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D2721] tracking-tight">
            Mis Finanzas
          </h1>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl border border-[#EDE8DF] p-6 sm:p-8 shadow-xs">
          {/* Quick Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#DDD6C8] bg-white text-[#2D2721] font-semibold text-sm hover:bg-[#FAF8F5] active:scale-[0.99] transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9678B6] disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EDE8DF]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#9A9184]">o con correo electrónico</span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#F5EFE6] p-1 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#2D2721] shadow-2xs'
                  : 'text-[#7A7267] hover:text-[#2D2721]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#2D2721] shadow-2xs'
                  : 'text-[#7A7267] hover:text-[#2D2721]'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#FDECE8] border border-[#F5C2BC] text-[#8B2E2E] text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5A5247] mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9184]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD6C8] bg-white text-sm text-[#2D2721] placeholder-[#A8A196] focus:outline-none focus:border-[#9678B6] focus:ring-2 focus:ring-[#9678B6]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A5247] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9184]"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD6C8] bg-white text-sm text-[#2D2721] placeholder-[#A8A196] focus:outline-none focus:border-[#9678B6] focus:ring-2 focus:ring-[#9678B6]/20 transition-all"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#5A5247] mb-1.5">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9184]"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD6C8] bg-white text-sm text-[#2D2721] placeholder-[#A8A196] focus:outline-none focus:border-[#9678B6] focus:ring-2 focus:ring-[#9678B6]/20 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#9678B6] hover:bg-[#8666A6] active:bg-[#785996] text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9678B6] disabled:opacity-50"
            >
              <span>{mode === 'signin' ? 'Entrar a Mis Finanzas' : 'Registrarme'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 grid grid-cols-2 gap-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#7A7267]">
            <CheckCircle2 size={14} className="text-[#8E9F7C]" />
            <span>Sincronización en tiempo real</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#7A7267]">
            <CheckCircle2 size={14} className="text-[#8E9F7C]" />
            <span>Protección privada con PIN</span>
          </div>
        </div>
      </div>
    </div>
  );
};
