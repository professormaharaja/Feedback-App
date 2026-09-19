export type SatisfactionLevel = 'Very Satisfied' | 'Satisfied' | 'Neutral' | 'Dissatisfied';

export interface StudentInitialDetails {
  studentName: string;
  classDepartment: string;
  collegeName: string;
}

export interface StudentFeedbackInput extends StudentInitialDetails {
  sessionFeedback: string; // Feedback About Resource Person's Session
  overallSatisfaction: SatisfactionLevel;
  areasOfImprovement: string;
  starRating: number; // 1 to 5
  resourcePersonScore: number; // 1 to 10
  suggestions: string;
}

export interface FeedbackSubmission extends StudentFeedbackInput {
  id: string;
  createdAt: string;
}

export interface FeedbackAnalysisResult {
  positiveHighlights: string[];
  negativeHighlights: string[];
  neutralHighlights: string[];
  sentimentBreakdown: {
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
  };
  keyThemes: string[];
  qualitativeSummary: string;
  analyzedAt: string;
}

export interface DemographicMetric {
  name: string;
  count: number;
  avgStar: number;
  avgScore: number;
}

export interface ExecutiveReport {
  reportTitle: string;
  generatedAt: string;
  resourcePersonName: string;
  executiveSummary: string;
  totalSubmissions: number;
  metrics: {
    averageStarRating: number;
    averageResourcePersonScore: number;
    satisfactionDistribution: {
      verySatisfied: number;
      satisfied: number;
      neutral: number;
      dissatisfied: number;
    };
  };
  demographics: {
    byCollege: DemographicMetric[];
    byDepartment: DemographicMetric[];
  };
  lectureDeliveryEvaluation: string;
  positiveKeyTakeaways: string[];
  criticalAreasForImprovement: string[];
  curatedStudentSuggestions: string[];
  strategicRecommendationsForProfessor: string[];
  driveExportStatus?: {
    status: 'idle' | 'exporting' | 'success' | 'error';
    fileId?: string;
    fileUrl?: string;
    fileName?: string;
    exportedAt?: string;
    errorMessage?: string;
  };
}
