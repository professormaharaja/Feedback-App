import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  StudentInitialDetails,
  StudentFeedbackInput,
  SatisfactionLevel,
} from '../types';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Send,
  Star,
  CheckCircle2,
  BookOpen,
  UserCheck,
  RotateCcw,
} from 'lucide-react';

interface StudentFeedbackPortalProps {
  onSubmitFeedback: (input: StudentFeedbackInput) => Promise<string>;
  isSubmitting: boolean;
}

const SATISFACTION_OPTIONS: SatisfactionLevel[] = [
  'Very Satisfied',
  'Satisfied',
  'Neutral',
  'Dissatisfied',
];

export function StudentFeedbackPortal({
  onSubmitFeedback,
  isSubmitting,
}: StudentFeedbackPortalProps) {
  // Step 1: Initial Form, Step 2: Core Feedback Form, Step 3: Submitted Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Initial Details State
  const [initialDetails, setInitialDetails] = useState<StudentInitialDetails>({
    studentName: '',
    classDepartment: '',
    collegeName: '',
  });

  // Core Feedback State
  const [sessionFeedback, setSessionFeedback] = useState('');
  const [overallSatisfaction, setOverallSatisfaction] =
    useState<SatisfactionLevel>('Very Satisfied');
  const [areasOfImprovement, setAreasOfImprovement] = useState('');
  const [starRating, setStarRating] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [resourcePersonScore, setResourcePersonScore] = useState<number>(10);
  const [suggestions, setSuggestions] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Handle Step 1 -> Step 2 transition
  const handleProceedToCoreFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!initialDetails.studentName.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }
    if (!initialDetails.classDepartment.trim()) {
      setValidationError('Please specify your class or department.');
      return;
    }
    if (!initialDetails.collegeName.trim()) {
      setValidationError('Please enter your college name.');
      return;
    }

    setStep(2);
  };

  // Handle Final Submit
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!sessionFeedback.trim()) {
      setValidationError(
        "Please provide your evaluation in 'Feedback About Resource Person's Session'."
      );
      return;
    }

    const payload: StudentFeedbackInput = {
      ...initialDetails,
      sessionFeedback: sessionFeedback.trim(),
      overallSatisfaction,
      areasOfImprovement: areasOfImprovement.trim(),
      starRating,
      resourcePersonScore,
      suggestions: suggestions.trim(),
    };

    try {
      const docId = await onSubmitFeedback(payload);
      setSubmittedId(docId);
      setStep(3);
    } catch (err: any) {
      setValidationError(
        err?.message || 'Failed to submit feedback. Please try again.'
      );
    }
  };

  // Clear form and reset for next user
  const handleResetForNextUser = () => {
    setInitialDetails({
      studentName: '',
      classDepartment: '',
      collegeName: '',
    });
    setSessionFeedback('');
    setOverallSatisfaction('Very Satisfied');
    setAreasOfImprovement('');
    setStarRating(5);
    setResourcePersonScore(10);
    setSuggestions('');
    setValidationError(null);
    setSubmittedId(null);
    setStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Institutional Session Banner (Black & Orange Theme) */}
      <div className="bg-neutral-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-black/15 border border-neutral-800 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            Official Resource Person Feedback Portal
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Resource Person: Dr. M. Maharaja
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed">
            Your feedback directly guides academic quality, lecture delivery
            enhancement, and curriculum depth. Please share your candid,
            constructive appraisal of today&apos;s keynote/seminar session.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 text-xs bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-lg text-neutral-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              Secure Database Storage
            </div>
            <div className="inline-flex items-center gap-2 text-xs bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-lg text-neutral-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              Anonymous &amp; Confidential Processing
            </div>
          </div>
        </div>

        {/* Decorative background geometry */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* STEP INDICATOR (White, Orange, Black) */}
      {step !== 3 && (
        <div className="flex items-center justify-between px-5 py-3.5 bg-white rounded-2xl border border-neutral-200 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                step === 1
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                  : 'bg-neutral-950 text-white'
              }`}
            >
              {step > 1 ? '✓' : '1'}
            </span>
            <span
              className={`font-bold ${
                step === 1 ? 'text-black' : 'text-neutral-500'
              }`}
            >
              Step 1: Student Details
            </span>
          </div>

          <div className="h-1 flex-1 mx-4 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 bg-orange-500 ${
                step === 2 ? 'w-full' : 'w-0'
              }`}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                step === 2
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                  : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              2
            </span>
            <span
              className={`font-bold ${
                step === 2 ? 'text-black' : 'text-neutral-400'
              }`}
            >
              Step 2: Core Session Feedback
            </span>
          </div>
        </div>
      )}

      {/* VALIDATION ERROR BANNER */}
      {validationError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2"
        >
          <span className="font-bold">Notice:</span> {validationError}
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* PAGE 1 - SECTION 1: WELCOME SCREEN / INITIAL FORM            */}
      {/* ============================================================ */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="form-step-1"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8"
          >
            <div className="border-b border-neutral-100 pb-5 mb-6">
              <h3 className="text-xl font-extrabold text-neutral-950 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-orange-500" />
                Student Registration &amp; Demographic Details
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Please enter your institutional affiliation before completing the
                feedback form.
              </p>
            </div>

            <form onSubmit={handleProceedToCoreFeedback} className="space-y-5">
              {/* Field: Student Name */}
              <div>
                <label
                  htmlFor="student-name-input"
                  className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1.5"
                >
                  Student Name <span className="text-orange-500">*</span>
                </label>
                <input
                  id="student-name-input"
                  type="text"
                  required
                  value={initialDetails.studentName}
                  onChange={(e) =>
                    setInitialDetails((prev) => ({
                      ...prev,
                      studentName: e.target.value,
                    }))
                  }
                  placeholder="e.g. S. Karthikeyan / Ananya Sharma"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-neutral-900 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-hidden transition-all placeholder:text-neutral-400 bg-white"
                />
              </div>

              {/* Field: Class / Department */}
              <div>
                <label
                  htmlFor="student-dept-input"
                  className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1.5"
                >
                  Class / Department <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="student-dept-input"
                    type="text"
                    required
                    value={initialDetails.classDepartment}
                    onChange={(e) =>
                      setInitialDetails((prev) => ({
                        ...prev,
                        classDepartment: e.target.value,
                      }))
                    }
                    placeholder="e.g. B.E. Computer Science (Final Year) / M.Tech AI"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-neutral-900 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-hidden transition-all placeholder:text-neutral-400 bg-white"
                  />
                </div>
              </div>

              {/* Field: College Name */}
              <div>
                <label
                  htmlFor="student-college-input"
                  className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1.5"
                >
                  College Name <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="student-college-input"
                    type="text"
                    required
                    value={initialDetails.collegeName}
                    onChange={(e) =>
                      setInitialDetails((prev) => ({
                        ...prev,
                        collegeName: e.target.value,
                      }))
                    }
                    placeholder="e.g. PSG College of Technology / Anna University"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-neutral-900 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-hidden transition-all placeholder:text-neutral-400 bg-white"
                  />
                </div>
              </div>

              {/* Transition Button */}
              <div className="pt-4 flex justify-end">
                <motion.button
                  id="btn-submit-details"
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all cursor-pointer"
                >
                  <span>Submit Details &amp; Proceed to Feedback</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* PAGE 1 - SECTION 2: CORE FEEDBACK FORM FIELDS                */}
        {/* ============================================================ */}
        {step === 2 && (
          <motion.div
            key="form-step-2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-6"
          >
            {/* Active Student Header Chip */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950 border border-neutral-800 text-white rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-sm shadow-xs shadow-orange-500/30">
                  {initialDetails.studentName.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {initialDetails.studentName}
                  </div>
                  <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                    <span>{initialDetails.classDepartment}</span>
                    <span>&bull;</span>
                    <span>{initialDetails.collegeName}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-6">
              {/* 1. Feedback About Resource Person's Session (Comprehensive text area) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="session-feedback-input"
                    className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4 text-orange-500" />
                    <span>Feedback About Resource Person&apos;s Session</span>
                    <span className="text-orange-500">*</span>
                  </label>
                  <span className="text-[11px] text-neutral-500">
                    Lecture quality, delivery &amp; content
                  </span>
                </div>
                <textarea
                  id="session-feedback-input"
                  required
                  rows={4}
                  value={sessionFeedback}
                  onChange={(e) => setSessionFeedback(e.target.value)}
                  placeholder="Share your comprehensive assessment of Dr. M. Maharaja's lecture. How effective was his explanation, pacing, clarity, domain depth, and student interaction?"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-neutral-900 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-hidden transition-all placeholder:text-neutral-400 bg-white resize-y"
                />
              </div>

              {/* 2. Overall Satisfaction (Dropdown) & Ratings in Star (Interactive UI) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overall Satisfaction */}
                <div>
                  <label
                    htmlFor="overall-satisfaction-select"
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5"
                  >
                    Overall Satisfaction <span className="text-orange-500">*</span>
                  </label>
                  <select
                    id="overall-satisfaction-select"
                    value={overallSatisfaction}
                    onChange={(e) =>
                      setOverallSatisfaction(e.target.value as SatisfactionLevel)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-900 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-hidden transition-all bg-white font-medium cursor-pointer"
                  >
                    {SATISFACTION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ratings in Star: Interactive UI rating from 1 to 5 Stars */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                    Ratings in Star (1 to 5 Stars){' '}
                    <span className="text-orange-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-4 py-2 rounded-xl">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isFilled =
                        (hoveredStar !== null
                          ? hoveredStar
                          : starRating) >= starVal;
                      return (
                        <motion.button
                          key={starVal}
                          id={`star-rating-${starVal}`}
                          type="button"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setStarRating(starVal)}
                          onMouseEnter={() => setHoveredStar(starVal)}
                          onMouseLeave={() => setHoveredStar(null)}
                          className="p-1 cursor-pointer focus:outline-hidden"
                          title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              isFilled
                                ? 'text-orange-500 fill-orange-500'
                                : 'text-neutral-300'
                            }`}
                          />
                        </motion.button>
                      );
                    })}
                    <span className="ml-auto font-bold text-xs text-orange-400 bg-neutral-950 px-2.5 py-0.5 rounded-md border border-neutral-800">
                      {starRating} of 5 Stars
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Resource Person Score: Numerical evaluation slider or scale from 1 to 10 */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Resource Person Score (Scale 1 to 10){' '}
                      <span className="text-orange-500">*</span>
                    </label>
                    <p className="text-[11px] text-neutral-500">
                      Numerical index reflecting Dr. M. Maharaja&apos;s overall lecture
                      efficacy
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-extrabold bg-neutral-950 text-orange-400 border border-orange-500/30 shadow-xs">
                      {resourcePersonScore} / 10
                    </span>
                  </div>
                </div>

                {/* Slider UI */}
                <input
                  id="resource-score-slider"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={resourcePersonScore}
                  onChange={(e) => setResourcePersonScore(Number(e.target.value))}
                  className="w-full accent-orange-500 h-2 bg-neutral-200 rounded-lg cursor-pointer"
                />

                {/* Discrete Numerical Buttons for quick precise click */}
                <div className="grid grid-cols-10 gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      id={`score-btn-${num}`}
                      type="button"
                      onClick={() => setResourcePersonScore(num)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        resourcePersonScore === num
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30 scale-105'
                          : 'bg-white text-neutral-800 border-neutral-200 hover:border-orange-300 hover:bg-neutral-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Areas of Improvement (Text input for constructive critiques) */}
              <div>
                <label
                  htmlFor="areas-of-improvement-input"
                  className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5"
                >
                  Areas of Improvement (Constructive Critiques)
                </label>
                <input
                  id="areas-of-improvement-input"
                  type="text"
                  value={areasOfImprovement}
                  onChange={(e) => setAreasOfImprovement(e.target.value)}
                  placeholder="e.g. Session pacing was slightly fast during numerical derivation; could allocate more time for Q&amp;A."
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-900 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-hidden transition-all placeholder:text-neutral-400 bg-white"
                />
              </div>

              {/* 5. Any Suggestions: Open text field for final thoughts */}
              <div>
                <label
                  htmlFor="suggestions-input"
                  className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5"
                >
                  Any Suggestions (Open Text Field for Final Thoughts)
                </label>
                <textarea
                  id="suggestions-input"
                  rows={3}
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="Any recommendations, follow-up topics, or practical workshops you would like Dr. M. Maharaja to conduct in the future?"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-900 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-hidden transition-all placeholder:text-neutral-400 bg-white resize-y"
                />
              </div>

              {/* Action: Final Submit button */}
              <div className="pt-4 flex items-center justify-between border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-neutral-500 hover:text-black px-3 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Back to Student Details
                </button>

                <motion.button
                  id="btn-final-submit"
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold text-sm shadow-md shadow-orange-500/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Data Securely...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Final Submit</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* PAGE 1 - SECTION 3: SUBMISSION SUCCESS CONFIRMATION          */}
        {/* ============================================================ */}
        {step === 3 && (
          <motion.div
            key="form-step-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8 sm:p-10 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-orange-50 text-orange-600 border border-orange-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm ring-4 ring-orange-50/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-neutral-950 tracking-tight">
                Feedback Successfully Submitted!
              </h3>
              <p className="text-sm text-neutral-600 mt-2 max-w-md mx-auto">
                Thank you for your valuable evaluation. Your response for{' '}
                <strong className="text-neutral-900">Dr. M. Maharaja&apos;s</strong> session has been securely saved
                to the database and synced for professor analytics.
              </p>
            </div>

            {submittedId && (
              <div className="inline-block bg-neutral-950 text-orange-400 px-4 py-2 rounded-xl text-xs font-mono border border-neutral-800 font-bold">
                Reference ID: {submittedId}
              </div>
            )}

            <div className="pt-4">
              <motion.button
                id="btn-submit-another"
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResetForNextUser}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-950 hover:bg-black text-white hover:text-orange-400 font-bold text-xs transition-all shadow-md cursor-pointer border border-neutral-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Submit Another Feedback / Clear Form for Next User</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
