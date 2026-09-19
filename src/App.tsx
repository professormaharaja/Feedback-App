import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Header, AUTHORIZED_PROFESSOR_EMAIL } from './components/Header';
import { StudentFeedbackPortal } from './components/StudentFeedbackPortal';
import { ProfessorGatekeeper } from './components/ProfessorGatekeeper';
import { ProfessorAnalyticsDashboard } from './components/ProfessorAnalyticsDashboard';
import { UniverseBackground } from './components/UniverseBackground';
import {
  FeedbackSubmission,
  StudentFeedbackInput,
} from './types';
import { initAuth, googleSignIn } from './lib/auth';
import {
  submitFeedbackToFirestore,
  fetchFeedbackSubmissions,
} from './lib/firestoreService';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'student' | 'professor'>('student');
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load submissions from Firestore or API
  const loadSubmissions = useCallback(async () => {
    try {
      const data = await fetchFeedbackSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.warn('Could not refresh submissions:', err);
    }
  }, []);

  // Initialize Firebase Auth listener on mount and load initial submissions
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUserData, token) => {
        setUser(authUserData);
        if (token) {
          setAccessToken(token);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    loadSubmissions();

    return () => unsubscribe();
  }, [loadSubmissions]);

  // Handle student feedback submission
  const handleStudentFeedbackSubmit = async (
    input: StudentFeedbackInput
  ): Promise<string> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const docId = await submitFeedbackToFirestore(input);

      // Refresh submissions in state
      await loadSubmissions();

      return docId;
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err?.message || 'Failed to record session feedback.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auth handler
  const handleAuthChange = (newUser: User | null, newToken: string | null) => {
    setUser(newUser);
    setAccessToken(newToken);
  };

  // Connect Google Drive
  const handleConnectDrive = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        handleAuthChange(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error('Drive connection error:', err);
      setError(err?.message || 'Failed to authenticate Google Drive.');
    }
  };

  // Clear all submissions to keep app raw
  const handleClearData = async () => {
    try {
      const res = await fetch('/api/feedback/clear', { method: 'POST' });
      if (res.ok) {
        setSubmissions([]);
      }
    } catch (err) {
      console.error('Failed to clear submissions:', err);
    }
  };

  // Quick simulation helper for reviewer testing
  const handleSimulateProfessorAuth = () => {
    const simulatedUser = {
      uid: 'prof-maharaja-simulated',
      email: AUTHORIZED_PROFESSOR_EMAIL,
      displayName: 'Dr. M. Maharaja (Resource Person)',
      emailVerified: true,
    } as unknown as User;

    setUser(simulatedUser);
    setActiveTab('professor');
  };

  const isAuthorizedProfessor =
    user?.email?.toLowerCase() === AUTHORIZED_PROFESSOR_EMAIL.toLowerCase();

  return (
    <div className="relative min-h-screen bg-[#05070e] text-neutral-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      {/* Animated Universe Background Model */}
      <UniverseBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          user={user}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onAuthChange={handleAuthChange}
          submissionCount={submissions.length}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Global Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-start gap-3 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold">System Notice</h4>
                <p className="mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'student' ? (
              <motion.div
                key="student-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <StudentFeedbackPortal
                  onSubmitFeedback={handleStudentFeedbackSubmit}
                  isSubmitting={isSubmitting}
                />
              </motion.div>
            ) : (
              <motion.div
                key="professor-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {isAuthorizedProfessor ? (
                  <ProfessorAnalyticsDashboard
                    submissions={submissions}
                    accessToken={accessToken}
                    onRefreshSubmissions={loadSubmissions}
                    onClearData={handleClearData}
                    onConnectDrive={handleConnectDrive}
                  />
                ) : (
                  <ProfessorGatekeeper
                    user={user}
                    onAuthSuccess={(authedUser, token) => {
                      setUser(authedUser);
                      setAccessToken(token);
                    }}
                    onBackToStudentPortal={() => setActiveTab('student')}
                    onSimulateProfessorAuth={handleSimulateProfessorAuth}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-md py-6 mt-12 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-neutral-400">
            <div>
              <span className="font-bold text-white">Dr. M. Maharaja&apos;s</span>{' '}
              Session Feedback System &bull; Resource Person Academic Evaluation &amp; Analytics
            </div>
            <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span>Real-time Secure Academic Feedback</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
