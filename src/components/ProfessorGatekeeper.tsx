import { useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { googleSignIn, logout } from '../lib/auth';
import { AUTHORIZED_PROFESSOR_EMAIL } from './Header';
import {
  Lock,
  ShieldAlert,
  LogIn,
  LogOut,
  ArrowLeft,
  Sparkles,
  KeyRound,
} from 'lucide-react';

interface ProfessorGatekeeperProps {
  user: User | null;
  onAuthSuccess: (user: User, token: string) => void;
  onBackToStudentPortal: () => void;
  onSimulateProfessorAuth?: () => void;
}

export function ProfessorGatekeeper({
  user,
  onAuthSuccess,
  onBackToStudentPortal,
  onSimulateProfessorAuth,
}: ProfessorGatekeeperProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setErrorMessage(
        err?.message ||
          'Google authentication was cancelled or could not be completed.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      onBackToStudentPortal();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Case A: User is logged in, but with an unauthorized email address
  if (
    user &&
    user.email?.toLowerCase() !== AUTHORIZED_PROFESSOR_EMAIL.toLowerCase()
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto py-12 px-4"
      >
        <div className="bg-white rounded-3xl border-2 border-rose-300 shadow-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 bg-rose-100 text-rose-900 text-xs font-extrabold uppercase tracking-wider rounded-full mb-2">
              Strict Gatekeeper: Access Denied
            </span>
            <h3 className="text-2xl font-extrabold text-neutral-950 tracking-tight">
              Unauthorized User Account
            </h3>
            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
              The Professor Analytics Dashboard is strictly restricted. Access
              is exclusively granted{' '}
              <strong className="text-neutral-950 font-extrabold">
                IF AND ONLY IF
              </strong>{' '}
              the logged-in email address matches exactly:
            </p>
            <div className="mt-3 inline-block px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-orange-400 font-bold">
              {AUTHORIZED_PROFESSOR_EMAIL}
            </div>
            <p className="text-xs text-rose-600 mt-3 font-semibold">
              You are currently logged in as:{' '}
              <span className="font-mono font-bold">{user.email}</span>. All
              other users are blocked.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              id="btn-unauth-switch"
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignOut}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-950 hover:bg-black text-white font-bold text-xs transition-all shadow-md cursor-pointer border border-neutral-800"
            >
              <LogOut className="w-3.5 h-3.5 text-orange-400" />
              <span>Switch / Sign Out Account</span>
            </motion.button>

            <motion.button
              id="btn-unauth-back"
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBackToStudentPortal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Student Feedback</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Case B: User is not logged in at all
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto py-12 px-4"
    >
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl p-8 sm:p-10 text-center space-y-6">
        <div className="w-16 h-16 bg-neutral-950 text-orange-400 rounded-2xl flex items-center justify-center mx-auto shadow-md border border-neutral-800 ring-4 ring-orange-500/10">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/15 text-orange-600 border border-orange-500/30 text-xs font-extrabold uppercase tracking-wider rounded-full mb-2">
            <KeyRound className="w-3.5 h-3.5" />
            Professor Gatekeeper
          </span>
          <h3 className="text-2xl font-extrabold text-neutral-950 tracking-tight">
            Professor Analytics Dashboard
          </h3>
          <p className="text-sm text-neutral-600 mt-2 leading-relaxed max-w-md mx-auto">
            This administrative analytics portal and executive report generator
            is protected behind an authentication wall. Access is exclusively
            granted to:
          </p>
          <div className="mt-3 inline-block px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-orange-400 font-bold shadow-xs">
            {AUTHORIZED_PROFESSOR_EMAIL}
          </div>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium"
          >
            {errorMessage}
          </motion.div>
        )}

        {/* Sign In Actions */}
        <div className="space-y-3 pt-2">
          <motion.button
            id="btn-gatekeeper-google"
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold text-sm shadow-md shadow-orange-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSigningIn ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating with Google...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google ({AUTHORIZED_PROFESSOR_EMAIL})</span>
              </>
            )}
          </motion.button>

          {/* Quick Demo Access toggle for professormaharaja@gmail.com */}
          {onSimulateProfessorAuth && (
            <div className="pt-2 border-t border-neutral-100">
              <button
                id="btn-simulate-professor"
                type="button"
                onClick={onSimulateProfessorAuth}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-900 hover:text-orange-600 font-bold py-1.5 px-3 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Authorize directly as professormaharaja@gmail.com for local inspection"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Quick Access as {AUTHORIZED_PROFESSOR_EMAIL}</span>
              </button>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToStudentPortal}
              className="text-xs text-neutral-500 hover:text-neutral-950 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Student Feedback Portal</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
