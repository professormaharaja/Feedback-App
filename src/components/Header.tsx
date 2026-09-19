import { User } from 'firebase/auth';
import { googleSignIn, logout } from '../lib/auth';
import { motion } from 'motion/react';
import {
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  LogIn,
  Users,
  BarChart3,
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  activeTab: 'student' | 'professor';
  onTabChange: (tab: 'student' | 'professor') => void;
  onAuthChange: (user: User | null, token: string | null) => void;
  submissionCount: number;
}

export const AUTHORIZED_PROFESSOR_EMAIL = 'professormaharaja@gmail.com';

export function Header({
  user,
  activeTab,
  onTabChange,
  onAuthChange,
  submissionCount,
}: HeaderProps) {
  const isAuthorizedProfessor =
    user?.email?.toLowerCase() === AUTHORIZED_PROFESSOR_EMAIL.toLowerCase();

  const handleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthChange(result.user, result.accessToken);
        if (result.user.email?.toLowerCase() === AUTHORIZED_PROFESSOR_EMAIL.toLowerCase()) {
          onTabChange('professor');
        }
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      onAuthChange(null, null);
      onTabChange('student');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 sticky top-0 z-30 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3.5">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-400/30"
            >
              <GraduationCap className="w-6 h-6" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white tracking-tight">
                  Dr. M. Maharaja&apos;s
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Session Feedback System
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                Resource Person Academic Evaluation &amp; Analytics Platform
              </p>
            </div>
          </div>

          {/* Navigation / Role Switcher Tabs */}
          <div className="flex items-center gap-2.5">
            <div className="bg-neutral-900 p-1 rounded-xl flex items-center border border-neutral-800 shadow-inner">
              <motion.button
                id="tab-student-feedback"
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => onTabChange('student')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'student'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Student Feedback</span>
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'student' ? 'bg-black/30 text-white' : 'bg-neutral-800 text-neutral-300'
                }`}>
                  {submissionCount}
                </span>
              </motion.button>

              <motion.button
                id="tab-professor-analytics"
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => onTabChange('professor')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'professor'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Professor Analytics</span>
                {isAuthorizedProfessor ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ) : (
                  <span className="text-[10px] text-orange-300 bg-orange-950/80 border border-orange-500/30 px-1.5 py-0.2 rounded font-mono">
                    Restricted
                  </span>
                )}
              </motion.button>
            </div>

            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-neutral-800">
                {isAuthorizedProfessor ? (
                  <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-white leading-tight">
                        Dr. M. Maharaja
                      </div>
                      <div className="text-[10px] text-emerald-400 truncate max-w-[140px]">
                        {user.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-1.5 bg-rose-950/60 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-white leading-tight">
                        Non-Professor User
                      </div>
                      <div className="text-[10px] text-rose-400 truncate max-w-[140px]">
                        {user.email}
                      </div>
                    </div>
                  </div>
                )}

                <motion.button
                  id="btn-signout"
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                id="btn-professor-signin"
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignIn}
                className="ml-2 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Professor Login</span>
                <span className="sm:hidden">Login</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
