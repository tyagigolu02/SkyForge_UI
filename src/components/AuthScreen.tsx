import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { loginUser, registerUser, loginWithGoogle } from '../services/api';

interface AuthScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  triggerReason?: 'LIMIT_EXCEEDED' | 'MANUAL';
}

/**
 * AuthScreen Component
 * Floating, borderless frosted glass modal adhering strictly to the "Abyssal Glass / Anti-Gravity" theme.
 * Features glowing inputs, Google quantum OAuth, and operator tier activation for guest limits.
 */
export const AuthScreen: React.FC<AuthScreenProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  triggerReason = 'LIMIT_EXCEEDED',
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      let res;
      if (mode === 'login') {
        res = await loginUser({ username, password });
      } else {
        res = await registerUser({ username, email, password });
      }

      if (res.success && res.data) {
        onAuthSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication handshake interrupted.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.success && res.data) {
        onAuthSuccess(res.data);
        onClose();
      }
    } catch {
      setErrorMsg('Google OAuth quantum link failed. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-2xl bg-black/65 overflow-y-auto">
        
        {/* Backdrop dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 cursor-pointer"
        />

        {/* The Floating Abyssal Glass Modal */}
        <motion.div
          initial={{ scale: 0.9, y: 35, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 35, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          className="relative z-10 w-full max-w-lg p-6 sm:p-9 rounded-[2.5rem] abyssal-glass shadow-portal overflow-hidden border-0"
        >
          {/* Ambient Counter-Rotating Particle Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              className="w-96 h-96 rounded-full border border-dashed border-cyan-400/25"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="w-72 h-72 rounded-full border border-purple-400/25"
            />
          </div>

          {/* Close Pill Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all shadow-abyssal z-20"
            title="Dismiss"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Floating Quantum Singularity Core */}
          <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 blur-2xl opacity-60 animate-pulse" />
            <div className="relative z-10 w-16 h-16 rounded-full abyssal-glass flex items-center justify-center shadow-underglow-cyan">
              <span className="font-mono text-xl text-cyan-300">⚡</span>
            </div>
          </div>

          {/* Header Typography */}
          <div className="text-center relative z-10 mb-6">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 inline-block mb-3">
              {triggerReason === 'LIMIT_EXCEEDED' ? t('auth.guestQuotaExhausted') : t('auth.operatorEnclave')}
            </span>

            <h2 className="font-display font-light text-2xl sm:text-3xl tracking-[0.18em] text-white uppercase">
              {t('auth.unlockPremium')}
            </h2>

            <p className="font-mono text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              {triggerReason === 'LIMIT_EXCEEDED'
                ? t('auth.limitMessage')
                : t('auth.operatorMessage')}
            </p>
          </div>

          {/* Sign In with Google Button */}
          <div className="relative z-10 mb-6">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, boxShadow: '0 0 35px rgba(0, 242, 254, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-mono text-xs tracking-[0.18em] uppercase shadow-underglow-cyan flex items-center justify-center gap-3 transition-all border border-white/10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{t('auth.signInWithGoogle')}</span>
            </motion.button>
          </div>

          <div className="relative z-10 flex items-center gap-3 my-5">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">
              {t('auth.orEmail')}
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Mode Switch Tabs */}
          <div className="relative z-10 flex p-1 rounded-2xl bg-white/[0.03] mb-5">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`flex-1 py-2 text-center font-mono text-[11px] tracking-wider transition-all rounded-xl relative ${
                mode === 'login' ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'login' && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-xl bg-white/[0.08] shadow-[0_0_15px_rgba(0,242,254,0.3)] backdrop-blur-md"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t('auth.operatorLogin')}</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              className={`flex-1 py-2 text-center font-mono text-[11px] tracking-wider transition-all rounded-xl relative ${
                mode === 'register' ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'register' && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-xl bg-white/[0.08] shadow-[0_0_15px_rgba(0,242,254,0.3)] backdrop-blur-md"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t('auth.createAccount')}</span>
            </button>
          </div>

          {/* Form with Glowing Inputs */}
          <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                {t('auth.username')}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="commander_01"
                className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:bg-white/[0.08] transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@skyforge.net"
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:bg-white/[0.08] transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]"
                />
              </div>
            )}

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                {t('auth.passkey')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:bg-white/[0.08] transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]"
              />
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs text-center"
              >
                {errorMsg}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-white font-mono text-xs font-bold tracking-[0.2em] uppercase shadow-underglow-cyan flex items-center justify-center gap-2 transition-all mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  {t('auth.authenticating')}
                </span>
              ) : (
                <span>{mode === 'login' ? t('auth.loginBtn') : t('auth.registerBtn')}</span>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center font-mono text-[9px] text-slate-500 tracking-wider">
            <span>TLS 1.3 // SPRING BOOT SECURE // JWT ENCLAVE</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthScreen;

