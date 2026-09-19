import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  FeedbackSubmission,
  FeedbackAnalysisResult,
  ExecutiveReport,
} from '../types';
import {
  uploadExecutiveReportToGoogleDrive,
} from '../lib/driveExport';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Star,
  Award,
  Users,
  Brain,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Printer,
  Sparkles,
  Search,
  Building,
  GraduationCap,
  ThumbsUp,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Clock,
  CloudCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface ProfessorAnalyticsDashboardProps {
  submissions: FeedbackSubmission[];
  accessToken: string | null;
  onRefreshSubmissions: () => void;
  onClearData: () => Promise<void>;
  onConnectDrive: () => Promise<void>;
}

const SATISFACTION_COLORS: Record<string, string> = {
  'Very Satisfied': '#f97316', // Vibrant Orange
  Satisfied: '#ea580c', // Deep Orange
  Neutral: '#525252', // Neutral Charcoal
  Dissatisfied: '#dc2626', // Red
};

export function ProfessorAnalyticsDashboard({
  submissions,
  accessToken,
  onRefreshSubmissions,
  onClearData,
  onConnectDrive,
}: ProfessorAnalyticsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('all');

  // AI Feedback Analyzer State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<FeedbackAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Executive Report Generator State
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [executiveReport, setExecutiveReport] =
    useState<ExecutiveReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // Google Drive Sync State
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [driveExportInfo, setDriveExportInfo] = useState<{
    status: 'idle' | 'success' | 'error';
    fileUrl?: string;
    fileName?: string;
    errorMsg?: string;
  }>({ status: 'idle' });

  // 1. DATA AGGREGATOR & QUANTITATIVE METRICS
  const totalSubmissions = submissions.length;

  const averageStarRating = useMemo(() => {
    if (totalSubmissions === 0) return 0;
    const sum = submissions.reduce((acc, s) => acc + (Number(s.starRating) || 0), 0);
    return Number((sum / totalSubmissions).toFixed(2));
  }, [submissions, totalSubmissions]);

  const averageResourcePersonScore = useMemo(() => {
    if (totalSubmissions === 0) return 0;
    const sum = submissions.reduce(
      (acc, s) => acc + (Number(s.resourcePersonScore) || 0),
      0
    );
    return Number((sum / totalSubmissions).toFixed(2));
  }, [submissions, totalSubmissions]);

  // Star Ratings Distribution for charts
  const starDistributionData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    submissions.forEach((s) => {
      const star = Math.min(Math.max(Math.round(s.starRating), 1), 5);
      counts[star - 1]++;
    });
    return [
      { name: '1 Star', count: counts[0] },
      { name: '2 Stars', count: counts[1] },
      { name: '3 Stars', count: counts[2] },
      { name: '4 Stars', count: counts[3] },
      { name: '5 Stars', count: counts[4] },
    ];
  }, [submissions]);

  // Resource Person Score Distribution for charts
  const scoreDistributionData = useMemo(() => {
    const counts: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
    };
    submissions.forEach((s) => {
      const sc = Math.min(Math.max(Math.round(s.resourcePersonScore), 1), 10);
      counts[sc] = (counts[sc] || 0) + 1;
    });
    return Object.entries(counts).map(([score, count]) => ({
      score: `${score}/10`,
      count,
    }));
  }, [submissions]);

  // Satisfaction Breakdown for Donut Chart
  const satisfactionDistributionData = useMemo(() => {
    const dist: Record<string, number> = {
      'Very Satisfied': 0,
      Satisfied: 0,
      Neutral: 0,
      Dissatisfied: 0,
    };
    submissions.forEach((s) => {
      if (dist[s.overallSatisfaction] !== undefined) {
        dist[s.overallSatisfaction]++;
      } else {
        dist['Satisfied']++;
      }
    });
    return Object.entries(dist)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [submissions]);

  // Demographic aggregation by College
  const collegeMetrics = useMemo(() => {
    const map = new Map<string, { count: number; totalScore: number }>();
    submissions.forEach((s) => {
      const c = s.collegeName.trim() || 'Other';
      const existing = map.get(c) || { count: 0, totalScore: 0 };
      existing.count += 1;
      existing.totalScore += Number(s.resourcePersonScore) || 9;
      map.set(c, existing);
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      avgScore: Number((data.totalScore / data.count).toFixed(1)),
    }));
  }, [submissions]);

  // Colleges list for filter
  const collegesList = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      if (s.collegeName.trim()) set.add(s.collegeName.trim());
    });
    return Array.from(set);
  }, [submissions]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchesCollege =
        selectedCollege === 'all' || s.collegeName === selectedCollege;
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        s.studentName.toLowerCase().includes(search) ||
        s.classDepartment.toLowerCase().includes(search) ||
        s.sessionFeedback.toLowerCase().includes(search) ||
        s.collegeName.toLowerCase().includes(search);
      return matchesCollege && matchesSearch;
    });
  }, [submissions, selectedCollege, searchTerm]);

  // 2. FEEDBACK ANALYZER TRIGGER
  const handleRunFeedbackAnalysis = async () => {
    if (submissions.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/analyze-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to complete AI analysis');
      }
      const data = await res.json();
      setAnalysisResult(data.analysis);
    } catch (err: any) {
      console.error('Feedback analysis error:', err);
      setAnalysisError(err?.message || 'AI feedback analysis encountered an error.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. EXECUTIVE REPORT GENERATOR TRIGGER
  const handleGenerateExecutiveReport = async () => {
    if (submissions.length === 0) return;
    setIsGeneratingReport(true);
    setReportError(null);

    try {
      const res = await fetch('/api/generate-executive-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate executive report');
      }
      const data = await res.json();
      setExecutiveReport(data.report);

      // If already authenticated with Google Drive, sync directly
      if (accessToken) {
        triggerDriveUpload(data.report, accessToken);
      }
    } catch (err: any) {
      console.error('Executive report error:', err);
      setReportError(err?.message || 'Executive report generation encountered an issue.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // 4. GOOGLE DRIVE SYNC TRIGGER
  const triggerDriveUpload = async (report: ExecutiveReport, token: string) => {
    setIsSyncingDrive(true);
    setDriveExportInfo({ status: 'idle' });
    try {
      const result = await uploadExecutiveReportToGoogleDrive(report, token);
      setDriveExportInfo({
        status: 'success',
        fileUrl: result.fileUrl,
        fileName: result.fileName,
      });
    } catch (err: any) {
      console.error('Google Drive sync error:', err);
      setDriveExportInfo({
        status: 'error',
        errorMsg: err?.message || 'Failed to upload report to Google Drive.',
      });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Offline HTML Report Download
  const handleDownloadReport = () => {
    if (!executiveReport) return;
    import('../lib/driveExport').then(({ buildExecutiveReportHtmlDocument }) => {
      const html = buildExecutiveReportHtmlDocument(executiveReport);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dr_M_Maharaja_Executive_Report_${new Date().toISOString().split('T')[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Top Welcome Bar */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-neutral-950 px-3 py-1 rounded-lg border border-neutral-800">
              Verified Access: professormaharaja@gmail.com
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-950 tracking-tight mt-2">
            Dr. M. Maharaja &bull; Session Analytics &amp; Intelligence
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Aggregated real-time metrics, AI feedback sentiment clustering, and
            executive reporting.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRefreshSubmissions}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer"
            title="Refresh database entries"
          >
            <RefreshCw className="w-3.5 h-3.5 text-neutral-700" />
            <span>Refresh</span>
          </motion.button>

          {submissions.length > 0 && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClearData}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors cursor-pointer"
              title="Clear all student feedback records"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear Submissions</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Raw Zero-State Banner */}
      {totalSubmissions === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border-2 border-dashed border-neutral-300 p-8 text-center space-y-3 shadow-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-neutral-950 text-orange-400 flex items-center justify-center mx-auto border border-neutral-800 ring-4 ring-orange-500/10">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-neutral-950">
            Raw System Ready &bull; No Student Feedback Recorded Yet
          </h3>
          <p className="text-xs text-neutral-500 max-w-lg mx-auto leading-relaxed">
            The platform is operating with zero pre-loaded data. Real-time evaluations submitted by students via Page 1 (Student Feedback Entry) will instantly appear here, update aggregate rating curves, and unlock AI feedback clustering.
          </p>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* VISUAL METRICS: METRIC CARDS & CHARTS                        */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Card 1: Average Star Rating */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 flex flex-col justify-between hover:border-orange-500/40 transition-all"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                Average Star Rating
              </span>
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-500 border border-orange-500/30 flex items-center justify-center">
                <Star className="w-5 h-5 fill-orange-400 text-orange-400" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-neutral-950 tracking-tight">
                {averageStarRating}
              </span>
              <span className="text-sm font-bold text-neutral-400">
                / 5.0 Stars
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-orange-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(averageStarRating)
                      ? 'fill-orange-400 text-orange-400'
                      : 'text-neutral-200'
                  }`}
                />
              ))}
              <span className="text-xs text-neutral-500 ml-1.5 font-bold">
                ({totalSubmissions} Evaluations)
              </span>
            </div>
          </div>

          {/* Mini Bar Chart of Star Distribution */}
          <div className="h-24 mt-4 pt-2 border-t border-neutral-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={starDistributionData}
                margin={{ top: 4, right: 0, left: -25, bottom: 0 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#737373' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#737373' }} />
                <Tooltip
                  contentStyle={{
                    fontSize: '11px',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    backgroundColor: '#0a0a0a',
                    borderColor: '#262626',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Metric Card 2: Average Resource Person Score */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 flex flex-col justify-between hover:border-orange-500/40 transition-all"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                Resource Person Score
              </span>
              <div className="w-9 h-9 rounded-xl bg-neutral-950 text-orange-400 border border-neutral-800 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-orange-600 tracking-tight">
                {averageResourcePersonScore}
              </span>
              <span className="text-sm font-bold text-neutral-400">
                / 10.0 Scale
              </span>
            </div>
            <div className="mt-2 text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>
                {averageResourcePersonScore >= 8.5
                  ? 'Exemplary Delivery Tier'
                  : 'High Satisfaction Tier'}
              </span>
            </div>
          </div>

          {/* Mini Bar Chart of 1-10 Scores */}
          <div className="h-24 mt-4 pt-2 border-t border-neutral-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scoreDistributionData.filter((d) => d.count > 0 || true)}
                margin={{ top: 4, right: 0, left: -25, bottom: 0 }}
              >
                <XAxis dataKey="score" tick={{ fontSize: 9, fill: '#737373' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#737373' }} />
                <Tooltip
                  contentStyle={{
                    fontSize: '11px',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    backgroundColor: '#0a0a0a',
                    borderColor: '#262626',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Metric Card 3: Overall Satisfaction Distribution */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 flex flex-col justify-between hover:border-orange-500/40 transition-all"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                Satisfaction Breakdown
              </span>
              <div className="w-9 h-9 rounded-xl bg-neutral-950 text-orange-400 border border-neutral-800 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-neutral-950 tracking-tight">
                {totalSubmissions}
              </span>
              <span className="text-sm font-bold text-neutral-400">
                Total Submissions
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {satisfactionDistributionData.map((s) => (
                <span
                  key={s.name}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${SATISFACTION_COLORS[s.name]}15`,
                    color: SATISFACTION_COLORS[s.name],
                  }}
                >
                  {s.name}: {s.value}
                </span>
              ))}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="h-24 mt-4 pt-2 border-t border-neutral-100 flex items-center justify-center">
            {satisfactionDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={satisfactionDistributionData}
                    innerRadius={22}
                    outerRadius={38}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {satisfactionDistributionData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={SATISFACTION_COLORS[entry.name] || '#f97316'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: '11px',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      backgroundColor: '#0a0a0a',
                      borderColor: '#262626',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-neutral-400">
                Awaiting submissions
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* College & Department Demographic Visualizer */}
      {collegeMetrics.length > 0 && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-extrabold text-neutral-950 flex items-center gap-2">
                <Building className="w-4 h-4 text-orange-500" />
                <span>Demographic Reach by Participating College</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Comparison of student representation and average resource person
                evaluation scores
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collegeMetrics.map((col) => (
              <motion.div
                key={col.name}
                whileHover={{ scale: 1.01 }}
                className="bg-neutral-50 rounded-2xl border border-neutral-200 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-neutral-950 truncate max-w-[180px]">
                    {col.name}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {col.count} Student{col.count > 1 ? 's' : ''} Responded
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-orange-600">
                    {col.avgScore} / 10
                  </div>
                  <div className="text-[10px] text-neutral-400 uppercase font-bold">
                    Avg Score
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODULE 1: AI-DRIVEN FEEDBACK ANALYZER                        */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-950 text-orange-400 border border-neutral-800 text-xs font-extrabold uppercase tracking-wider mb-2">
              <Brain className="w-3.5 h-3.5 text-orange-400" />
              AI Feedback Analyzer
            </div>
            <h3 className="text-xl font-extrabold text-neutral-950">
              Qualitative Sentiment &amp; Highlight Clustering
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Automatically groups student comments, areas of improvement, and
              suggestions into positive, negative, and neutral highlights.
            </p>
          </div>

          <motion.button
            id="btn-run-feedback-analyzer"
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRunFeedbackAnalysis}
            disabled={isAnalyzing || submissions.length === 0}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Clustering Highlights...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run AI Feedback Analysis</span>
              </>
            )}
          </motion.button>
        </div>

        {analysisError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
            {analysisError}
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Sentiment Gauge & Summary */}
            <div className="bg-neutral-50 rounded-2xl p-5 sm:p-6 border border-neutral-200">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                    AI Qualitative Assessment Summary
                  </h4>
                  <p className="text-sm font-medium text-neutral-900 mt-1 leading-relaxed">
                    {analysisResult.qualitativeSummary}
                  </p>
                </div>

                {/* Sentiment Breakdown percentages */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-center px-3 py-1.5 bg-orange-500/15 border border-orange-500/30 rounded-xl">
                    <span className="text-xs font-black text-orange-600 block">
                      {analysisResult.sentimentBreakdown.positivePercentage}%
                    </span>
                    <span className="text-[10px] text-orange-700 font-bold uppercase">
                      Positive
                    </span>
                  </div>
                  <div className="text-center px-3 py-1.5 bg-neutral-200 border border-neutral-300 rounded-xl">
                    <span className="text-xs font-black text-neutral-800 block">
                      {analysisResult.sentimentBreakdown.neutralPercentage}%
                    </span>
                    <span className="text-[10px] text-neutral-600 font-bold uppercase">
                      Neutral
                    </span>
                  </div>
                  <div className="text-center px-3 py-1.5 bg-rose-100 border border-rose-200 rounded-xl">
                    <span className="text-xs font-black text-rose-700 block">
                      {analysisResult.sentimentBreakdown.negativePercentage}%
                    </span>
                    <span className="text-[10px] text-rose-600 font-bold uppercase">
                      Critique
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Themes Chips */}
              {analysisResult.keyThemes && analysisResult.keyThemes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-neutral-200 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase">
                    Key Themes:
                  </span>
                  {analysisResult.keyThemes.map((theme) => (
                    <span
                      key={theme}
                      className="px-3 py-1 rounded-full bg-white border border-neutral-300 text-xs text-neutral-800 font-semibold shadow-2xs"
                    >
                      #{theme}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 3 Structured Highlight Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Positive Highlights */}
              <div className="bg-orange-500/5 rounded-2xl border border-orange-500/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-neutral-950 font-extrabold text-sm">
                  <ThumbsUp className="w-4 h-4 text-orange-500" />
                  <h4>Positive Highlights</h4>
                  <span className="ml-auto text-xs bg-orange-500/15 text-orange-600 border border-orange-500/30 px-2 py-0.5 rounded-full font-extrabold">
                    {analysisResult.positiveHighlights.length}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Lecture mastery, clarity, practical cases &amp; audience
                  connection
                </p>
                <ul className="space-y-2 mt-2">
                  {analysisResult.positiveHighlights.map((pos, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-neutral-900 bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs leading-relaxed"
                    >
                      {pos}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Negative Highlights (Constructive Critiques) */}
              <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h4>Negative Highlights</h4>
                  <span className="ml-auto text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-extrabold">
                    {analysisResult.negativeHighlights.length}
                  </span>
                </div>
                <p className="text-[11px] text-rose-600">
                  Areas of improvement, pacing issues &amp; student friction
                  points
                </p>
                <ul className="space-y-2 mt-2">
                  {analysisResult.negativeHighlights.map((neg, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-rose-950 bg-white p-3 rounded-xl border border-rose-100 shadow-2xs leading-relaxed"
                    >
                      {neg}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Neutral Highlights */}
              <div className="bg-neutral-100/70 rounded-2xl border border-neutral-200 p-5 space-y-3">
                <div className="flex items-center gap-2 text-neutral-900 font-extrabold text-sm">
                  <HelpCircle className="w-4 h-4 text-neutral-600" />
                  <h4>Neutral Highlights</h4>
                  <span className="ml-auto text-xs bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-full font-extrabold">
                    {analysisResult.neutralHighlights.length}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  General suggestions, logistical notes &amp; balanced feedback
                </p>
                <ul className="space-y-2 mt-2">
                  {analysisResult.neutralHighlights.map((neu, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-neutral-900 bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs leading-relaxed"
                    >
                      {neu}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-8 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
            <Brain className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-neutral-600">
              Click &quot;Run AI Feedback Analysis&quot; to group student feedback
              into positive, negative, and neutral clusters.
            </p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODULE 2: EXECUTIVE REPORT GENERATOR                         */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/15 text-orange-600 border border-orange-500/30 text-xs font-extrabold uppercase tracking-wider mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5 text-orange-500" />
              Executive Report Generator
            </div>
            <h3 className="text-xl font-extrabold text-neutral-950">
              Official Executive Performance Report Summary
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Synthesizes all text feedback, scores, and demographic analytics
              (by Class and College) into an official executive performance report.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              id="btn-generate-executive-report"
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateExecutiveReport}
              disabled={isGeneratingReport || submissions.length === 0}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-950 hover:bg-black text-white font-extrabold text-xs shadow-md border border-neutral-800 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingReport ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Executive Report...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>Generate Executive Report</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {reportError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
            {reportError}
          </div>
        )}

        {/* Executive Report Card View */}
        {executiveReport ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Actions Bar (Google Drive Sync, Download, Print) */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-xs font-bold text-neutral-950">
                    Report Synthesized Successfully
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Ready for institutional export or sync to Google Drive
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Google Drive Sync Button */}
                {accessToken ? (
                  <motion.button
                    id="btn-sync-google-drive"
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => triggerDriveUpload(executiveReport, accessToken)}
                    disabled={isSyncingDrive}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSyncingDrive ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Uploading to Drive...</span>
                      </>
                    ) : (
                      <>
                        <CloudCheck className="w-3.5 h-3.5" />
                        <span>Sync Directly to Google Drive</span>
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onConnectDrive}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-100 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <CloudCheck className="w-3.5 h-3.5 text-orange-500" />
                    <span>Connect Drive to Auto-Sync</span>
                  </motion.button>
                )}

                {/* Download Offline HTML */}
                <motion.button
                  id="btn-download-html"
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadReport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-100 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Download Report HTML</span>
                </motion.button>

                {/* Print */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-100 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Print</span>
                </motion.button>
              </div>
            </div>

            {/* Google Drive Upload Notice */}
            {driveExportInfo.status === 'success' && driveExportInfo.fileUrl && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">
                      Report Synced to Google Drive Folder: &quot;Dr. M. Maharaja
                      Session Reports&quot;
                    </div>
                    <div className="text-[11px] text-emerald-700 font-mono">
                      File: {driveExportInfo.fileName}
                    </div>
                  </div>
                </div>

                <a
                  href={driveExportInfo.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  <span>Open in Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Synthesized Report Content Box */}
            <div className="border border-neutral-200 rounded-2xl p-6 bg-white space-y-6 shadow-sm">
              <div className="border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-orange-400 bg-neutral-950 px-3 py-1 rounded-lg border border-neutral-800 uppercase">
                    Official Executive Summary
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {new Date(executiveReport.generatedAt).toLocaleString()}
                  </span>
                </div>
                <h4 className="text-xl font-extrabold text-neutral-950 mt-2">
                  {executiveReport.reportTitle}
                </h4>
              </div>

              {/* Executive Summary */}
              <div>
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Executive Performance Synthesis
                </h5>
                <p className="text-sm text-neutral-900 leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-200 font-medium">
                  {executiveReport.executiveSummary}
                </p>
              </div>

              {/* Lecture Delivery & Pedagogical Evaluation */}
              <div>
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Lecture Quality &amp; Delivery Evaluation
                </h5>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {executiveReport.lectureDeliveryEvaluation}
                </p>
              </div>

              {/* Demographic Breakdown by College & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-2">
                    Demographic Analytics by College
                  </h5>
                  <div className="space-y-2">
                    {executiveReport.demographics.byCollege.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between text-xs p-3 rounded-xl bg-neutral-50 border border-neutral-200"
                      >
                        <span className="font-bold text-neutral-900 truncate max-w-[200px]">
                          {col.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-500 font-mono">
                            n={col.count}
                          </span>
                          <span className="font-black text-orange-600">
                            {col.avgScore}/10
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-2">
                    Demographic Analytics by Class / Department
                  </h5>
                  <div className="space-y-2">
                    {executiveReport.demographics.byDepartment.map((dept) => (
                      <div
                        key={dept.name}
                        className="flex items-center justify-between text-xs p-3 rounded-xl bg-neutral-50 border border-neutral-200"
                      >
                        <span className="font-bold text-neutral-900 truncate max-w-[200px]">
                          {dept.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-500 font-mono">
                            n={dept.count}
                          </span>
                          <span className="font-black text-orange-600">
                            {dept.avgScore}/10
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Positive Highlights and Critical Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/20">
                  <h5 className="text-xs font-extrabold text-neutral-950 uppercase tracking-wider mb-2">
                    Key Institutional Wins &amp; Highlights
                  </h5>
                  <ul className="space-y-1.5 text-xs text-neutral-800 font-medium">
                    {executiveReport.positiveKeyTakeaways.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-500 font-bold">&bull;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200">
                  <h5 className="text-xs font-extrabold text-rose-900 uppercase tracking-wider mb-2">
                    Critical Areas for Improvement
                  </h5>
                  <ul className="space-y-1.5 text-xs text-rose-950 font-medium">
                    {executiveReport.criticalAreasForImprovement.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold">&bull;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Strategic Recommendations for Dr. M. Maharaja */}
              <div className="bg-neutral-950 text-white p-5 rounded-2xl border border-neutral-800">
                <h5 className="text-xs font-extrabold text-orange-400 uppercase tracking-wider mb-2">
                  Strategic Recommendations for Dr. M. Maharaja
                </h5>
                <ul className="space-y-2 text-xs text-neutral-300 font-medium">
                  {executiveReport.strategicRecommendationsForProfessor.map(
                    (rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-400 font-bold">&bull;</span>
                        <span>{rec}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-8 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
            <FileSpreadsheet className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-neutral-600">
              Click &quot;Generate Executive Report&quot; to synthesize all student
              feedback, scores, and demographic analytics into an official
              institutional summary.
            </p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* RAW DATA AGGREGATOR TABLE                                    */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-neutral-950 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-orange-500" />
              <span>Student Feedback Submissions Explorer</span>
              <span className="text-xs font-bold text-neutral-400">
                ({filteredSubmissions.length} of {totalSubmissions})
              </span>
            </h3>
            <p className="text-xs text-neutral-500">
              All raw evaluations submitted through Page 1
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student, department..."
                className="pl-8 pr-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-hidden w-48 sm:w-56"
              />
            </div>

            {/* College Filter */}
            {collegesList.length > 0 && (
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-hidden font-bold"
              >
                <option value="all">All Colleges ({collegesList.length})</option>
                {collegesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-3 pt-2">
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="border border-neutral-200 rounded-2xl p-5 bg-neutral-50/60 hover:bg-neutral-50 transition-colors space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-neutral-950">
                      {sub.studentName}
                    </span>
                    <span className="text-xs text-neutral-400">&bull;</span>
                    <span className="text-xs font-semibold text-neutral-700">
                      {sub.classDepartment}
                    </span>
                    <span className="text-xs text-neutral-400">&bull;</span>
                    <span className="text-xs font-medium text-neutral-500">
                      {sub.collegeName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `${
                          SATISFACTION_COLORS[sub.overallSatisfaction] || '#f97316'
                        }15`,
                        color:
                          SATISFACTION_COLORS[sub.overallSatisfaction] ||
                          '#f97316',
                      }}
                    >
                      {sub.overallSatisfaction}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-500/10 px-2.5 py-0.5 rounded-md border border-orange-500/20">
                      <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                      {sub.starRating}★
                    </span>

                    <span className="inline-flex items-center text-xs font-bold text-orange-400 bg-neutral-950 px-2.5 py-0.5 rounded-md border border-neutral-800">
                      Score: {sub.resourcePersonScore}/10
                    </span>
                  </div>
                </div>

                <div className="text-xs text-neutral-800 leading-relaxed">
                  <strong className="text-neutral-950 font-bold">Session Evaluation: </strong>
                  &quot;{sub.sessionFeedback}&quot;
                </div>

                {(sub.areasOfImprovement || sub.suggestions) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    {sub.areasOfImprovement && (
                      <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-rose-950">
                        <strong className="text-rose-900 block text-[11px] uppercase tracking-wider mb-0.5 font-bold">
                          Areas of Improvement:
                        </strong>
                        {sub.areasOfImprovement}
                      </div>
                    )}
                    {sub.suggestions && (
                      <div className="bg-orange-500/5 p-3 rounded-xl border border-orange-500/20 text-neutral-900">
                        <strong className="text-orange-600 block text-[11px] uppercase tracking-wider mb-0.5 font-bold">
                          Student Suggestions:
                        </strong>
                        {sub.suggestions}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>Submitted: {new Date(sub.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-neutral-50 rounded-2xl text-neutral-400 text-xs font-medium border border-neutral-200">
              No student submissions match the current filter.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
