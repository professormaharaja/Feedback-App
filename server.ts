import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing or not configured.');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// 2. Client ID endpoint for Google OAuth
app.get('/api/auth/client-id', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
});

// In-memory feedback store with initial realistic sample data for Dr. M. Maharaja
interface ServerSubmission {
  id: string;
  studentName: string;
  classDepartment: string;
  collegeName: string;
  sessionFeedback: string;
  overallSatisfaction: string;
  areasOfImprovement: string;
  starRating: number;
  resourcePersonScore: number;
  suggestions: string;
  createdAt: string;
}

// In-memory feedback store starts empty (raw app without pre-loaded data)
const submissionsStore: ServerSubmission[] = [];

// Feedback CRUD endpoints
app.get('/api/feedback', (req, res) => {
  res.json({
    success: true,
    count: submissionsStore.length,
    submissions: submissionsStore,
  });
});

app.post('/api/feedback', (req, res) => {
  try {
    const {
      studentName,
      classDepartment,
      collegeName,
      sessionFeedback,
      overallSatisfaction,
      areasOfImprovement,
      starRating,
      resourcePersonScore,
      suggestions,
      createdAt,
      id,
    } = req.body;

    if (!studentName || !classDepartment || !collegeName || !sessionFeedback) {
      return res.status(400).json({ error: 'Missing required student feedback fields.' });
    }

    const newSubmission: ServerSubmission = {
      id: id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentName,
      classDepartment,
      collegeName,
      sessionFeedback,
      overallSatisfaction: overallSatisfaction || 'Satisfied',
      areasOfImprovement: areasOfImprovement || '',
      starRating: Number(starRating) || 5,
      resourcePersonScore: Number(resourcePersonScore) || 9,
      suggestions: suggestions || '',
      createdAt: createdAt || new Date().toISOString(),
    };

    // Avoid duplicate IDs if already synced from Firestore
    const existingIndex = submissionsStore.findIndex((s) => s.id === newSubmission.id);
    if (existingIndex >= 0) {
      submissionsStore[existingIndex] = newSubmission;
    } else {
      submissionsStore.unshift(newSubmission);
    }

    res.json({ success: true, id: newSubmission.id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to record feedback' });
  }
});

app.post('/api/feedback/clear', (req, res) => {
  submissionsStore.length = 0;
  res.json({ success: true, count: 0, submissions: [] });
});

app.post('/api/feedback/reset-seed', (req, res) => {
  submissionsStore.length = 0;
  res.json({ success: true, count: 0, submissions: [] });
});

// AI Feedback Analyzer Endpoint
app.post('/api/analyze-feedback', async (req, res) => {
  try {
    const { submissions } = req.body;
    const items: ServerSubmission[] = Array.isArray(submissions) && submissions.length > 0 ? submissions : submissionsStore;

    if (items.length === 0) {
      return res.status(400).json({ error: 'No feedback submissions available to analyze.' });
    }

    const ai = getGeminiClient();

    const formattedData = items.map((s, idx) => `
[Submission #${idx + 1}]
Student: ${s.studentName} (${s.classDepartment}, ${s.collegeName})
Overall Satisfaction: ${s.overallSatisfaction} | Star Rating: ${s.starRating}/5 | Resource Person Score: ${s.resourcePersonScore}/10
Session Evaluation (Lecture Quality, Delivery & Content): "${s.sessionFeedback}"
Areas of Improvement: "${s.areasOfImprovement || 'None noted'}"
Suggestions: "${s.suggestions || 'None noted'}"
`).join('\n---\n');

    const prompt = `You are a Senior Academic Quality Assessor evaluating student feedback for resource person Dr. M. Maharaja.
Analyze the following student feedback submissions and group the student comments, areas of improvement, and suggestions into three structured categories:
1. Positive Highlights: Specific compliments on lecture quality, content depth, delivery eloquence, practical examples, and audience connection.
2. Negative Highlights: Constructive critiques, identified friction points, pace concerns, or areas requiring pedagogical adjustment.
3. Neutral Highlights: General procedural observations, logistical remarks, or balanced suggestions.

Also determine sentiment breakdown percentages (positive, negative, neutral) summing to 100, dominant themes, and a concise 2-sentence qualitative summary.

Data:
${formattedData}

Return strictly valid JSON with this exact schema:
{
  "positiveHighlights": ["string", "string", ...],
  "negativeHighlights": ["string", "string", ...],
  "neutralHighlights": ["string", "string", ...],
  "sentimentBreakdown": {
    "positivePercentage": number,
    "negativePercentage": number,
    "neutralPercentage": number
  },
  "keyThemes": ["string", "string", ...],
  "qualitativeSummary": "string"
}`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let responseText = '';
    let lastError: any = null;

    for (const model of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json' },
          });
          responseText = response.text || '';
          if (responseText) break;
        } catch (err) {
          lastError = err;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      throw lastError || new Error('Failed to generate AI feedback analysis.');
    }

    const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleaned);
    result.analyzedAt = new Date().toISOString();

    res.json({ success: true, analysis: result });
  } catch (error: any) {
    console.error('Feedback analysis error:', error);
    res.status(500).json({ error: error?.message || 'Analysis failed' });
  }
});

// AI Executive Report Generator Endpoint
app.post('/api/generate-executive-report', async (req, res) => {
  try {
    const { submissions } = req.body;
    const items: ServerSubmission[] = Array.isArray(submissions) && submissions.length > 0 ? submissions : submissionsStore;

    if (items.length === 0) {
      return res.status(400).json({ error: 'No feedback submissions available to generate report.' });
    }

    // Compute quantitative metrics
    const totalSubmissions = items.length;
    const avgStarRating = Number((items.reduce((acc, i) => acc + (Number(i.starRating) || 0), 0) / totalSubmissions).toFixed(2));
    const avgResourcePersonScore = Number((items.reduce((acc, i) => acc + (Number(i.resourcePersonScore) || 0), 0) / totalSubmissions).toFixed(2));

    const satisfactionCounts = {
      verySatisfied: items.filter((i) => i.overallSatisfaction === 'Very Satisfied').length,
      satisfied: items.filter((i) => i.overallSatisfaction === 'Satisfied').length,
      neutral: items.filter((i) => i.overallSatisfaction === 'Neutral').length,
      dissatisfied: items.filter((i) => i.overallSatisfaction === 'Dissatisfied').length,
    };

    // Demographic aggregation by College
    const collegeMap = new Map<string, { count: number; stars: number; scores: number }>();
    items.forEach((i) => {
      const college = i.collegeName || 'Unspecified College';
      const existing = collegeMap.get(college) || { count: 0, stars: 0, scores: 0 };
      existing.count += 1;
      existing.stars += Number(i.starRating) || 5;
      existing.scores += Number(i.resourcePersonScore) || 9;
      collegeMap.set(college, existing);
    });
    const byCollege = Array.from(collegeMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      avgStar: Number((data.stars / data.count).toFixed(2)),
      avgScore: Number((data.scores / data.count).toFixed(2)),
    }));

    // Demographic aggregation by Department/Class
    const deptMap = new Map<string, { count: number; stars: number; scores: number }>();
    items.forEach((i) => {
      const dept = i.classDepartment || 'General Cohort';
      const existing = deptMap.get(dept) || { count: 0, stars: 0, scores: 0 };
      existing.count += 1;
      existing.stars += Number(i.starRating) || 5;
      existing.scores += Number(i.resourcePersonScore) || 9;
      deptMap.set(dept, existing);
    });
    const byDepartment = Array.from(deptMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      avgStar: Number((data.stars / data.count).toFixed(2)),
      avgScore: Number((data.scores / data.count).toFixed(2)),
    }));

    const ai = getGeminiClient();

    const prompt = `You are an elite Educational Executive Operations Consultant preparing an official Executive Performance Report for Resource Person Dr. M. Maharaja.
Synthesize all student text feedback, numerical ratings, and demographic analytics into a comprehensive, authoritative institutional report.

Quantitative Data Summary:
- Resource Person: Dr. M. Maharaja
- Total Student Submissions: ${totalSubmissions}
- Average Star Rating: ${avgStarRating} / 5.0
- Average Resource Person Score: ${avgResourcePersonScore} / 10.0
- Satisfaction Distribution: ${satisfactionCounts.verySatisfied} Very Satisfied, ${satisfactionCounts.satisfied} Satisfied, ${satisfactionCounts.neutral} Neutral, ${satisfactionCounts.dissatisfied} Dissatisfied
- Participating Colleges: ${byCollege.map((c) => `${c.name} (n=${c.count}, avg score=${c.avgScore})`).join('; ')}
- Participating Departments: ${byDepartment.map((d) => `${d.name} (n=${d.count})`).join('; ')}

Qualitative Excerpts from Students:
${items.map((i, idx) => `
Student ${idx + 1} (${i.classDepartment}, ${i.collegeName}) [Rating: ${i.starRating}★, Score: ${i.resourcePersonScore}/10]:
Session Feedback: "${i.sessionFeedback}"
Areas of Improvement: "${i.areasOfImprovement}"
Suggestions: "${i.suggestions}"
`).join('\n')}

Generate the official executive performance report with rigorous academic and institutional depth.
Return strictly valid JSON adhering to:
{
  "reportTitle": "Official Executive Performance Report & Resource Person Analytics: Dr. M. Maharaja",
  "executiveSummary": "string (comprehensive executive synthesis)",
  "lectureDeliveryEvaluation": "string (in-depth analysis of pedagogical mastery, engagement pacing, and communicative clarity)",
  "positiveKeyTakeaways": ["string", "string", ...],
  "criticalAreasForImprovement": ["string", "string", ...],
  "curatedStudentSuggestions": ["string", "string", ...],
  "strategicRecommendationsForProfessor": ["string", "string", ...]
}`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let responseText = '';
    let lastError: any = null;

    for (const model of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json' },
          });
          responseText = response.text || '';
          if (responseText) break;
        } catch (err) {
          lastError = err;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      throw lastError || new Error('Failed to generate executive report.');
    }

    const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const aiReport = JSON.parse(cleaned);

    const fullExecutiveReport = {
      reportTitle: aiReport.reportTitle || "Official Executive Performance Report: Dr. M. Maharaja",
      generatedAt: new Date().toISOString(),
      resourcePersonName: "Dr. M. Maharaja",
      executiveSummary: aiReport.executiveSummary,
      totalSubmissions,
      metrics: {
        averageStarRating: avgStarRating,
        averageResourcePersonScore: avgResourcePersonScore,
        satisfactionDistribution: satisfactionCounts,
      },
      demographics: {
        byCollege,
        byDepartment,
      },
      lectureDeliveryEvaluation: aiReport.lectureDeliveryEvaluation,
      positiveKeyTakeaways: aiReport.positiveKeyTakeaways || [],
      criticalAreasForImprovement: aiReport.criticalAreasForImprovement || [],
      curatedStudentSuggestions: aiReport.curatedStudentSuggestions || [],
      strategicRecommendationsForProfessor: aiReport.strategicRecommendationsForProfessor || [],
    };

    res.json({ success: true, report: fullExecutiveReport });
  } catch (error: any) {
    console.error('Executive report generation error:', error);
    res.status(500).json({ error: error?.message || 'Report generation failed' });
  }
});

app.post('/api/generate-reports', async (req, res) => {
  try {
    const { feedbackGiverName, sessionNotes, guestInsights, sessionRating, starRating, sessionDate, subjectOrGrade } = req.body;

    if (!feedbackGiverName || !sessionNotes || !guestInsights || !sessionRating || !starRating) {
      return res.status(400).json({
        error: 'Missing required fields: feedbackGiverName, sessionNotes, guestInsights, sessionRating, and starRating are required.',
      });
    }

    const ai = getGeminiClient();

    const systemPrompt = `You are an expert Instructional Supervisor and Educational Operations Manager for an elite tutoring organization.
Your responsibility is to analyze tutoring session observations and deliver high-precision reports.

The user will provide:
1. Feedback Giver Name (Tutor or Observer): "${feedbackGiverName}"
2. Session Summary & Performance Notes: "${sessionNotes}"
3. Guest Speaker Insights (Dr. M. Maharaja): "${guestInsights}"
4. Session Rating: "${sessionRating}"
5. Star Rating: "${starRating}"
Additional Context: Session Date: ${sessionDate || 'Current'}, Subject/Grade: ${subjectOrGrade || 'Academic Mentorship'}

You must execute the following workflow:

STEP 1: Thoroughly analyze the session notes and the specific feedback regarding Guest Speaker Dr. M. Maharaja to identify:
- Key teaching wins (pedagogical strengths, concept mastery, student breakthroughs)
- Student engagement levels and qualitative dynamics
- Guest speaker Dr. M. Maharaja's impact (audience connection, depth of subject expertise, student resonance)

STEP 2: Generate a client-facing "Student & Parent Feedback Report":
- Tone: Professional yet genuinely encouraging, supportive, inspiring, and clear.
- Summarize what was covered without educational jargon.
- Highlight student wins, breakthroughs, and effort.
- Explicitly acknowledge and spotlight Dr. M. Maharaja's guest contribution to the session and the takeaways for the student.
- Provide constructive, motivating next steps and home reinforcement recommendations.

STEP 3: Generate a separate, high-level "Executive Operations Report" explicitly addressed to the Owner:
- Explicitly address the Owner with candid, executive-level precision.
- Clearly include:
  * Submitted By: ${feedbackGiverName}
  * Performance Tier: ${sessionRating} and ${starRating}
  * Guest Evaluation: Synthesized breakdown of Dr. M. Maharaja's segment (pedagogical value, student engagement/retention impact, and actionable recommendations for future guest speaker appearances)
  * Internal Summary: A candid, no-fluff operational summary of the session's success, instructional efficacy, operational risks or gaps, and concrete areas for improvement.

Output MUST be strictly valid JSON conforming to the following structure:
{
  "analysis": {
    "keyTeachingWins": ["string", "string"],
    "studentEngagementLevel": "High" | "Moderate-High" | "Moderate" | "Needs Improvement",
    "studentEngagementAnalysis": "string",
    "guestSpeakerImpact": {
      "summary": "string",
      "keyTakeaways": ["string", "string"],
      "audienceResonance": "string"
    }
  },
  "studentParentReport": {
    "reportTitle": "string",
    "encouragingWelcome": "string",
    "sessionOverview": "string",
    "topicsAndConceptsCovered": ["string", "string"],
    "studentWinsAndAchievements": ["string", "string"],
    "drMaharajaGuestSpotlight": {
      "highlightSummary": "string",
      "takeawaysForStudents": ["string", "string"],
      "inspirationalNote": "string"
    },
    "recommendedNextSteps": ["string", "string"],
    "tutorClosingMessage": "string"
  },
  "ownerExecutiveReport": {
    "submittedBy": "${feedbackGiverName}",
    "performanceTier": {
      "sessionRating": "${sessionRating}",
      "starRating": "${starRating}",
      "compositeAssessment": "string (e.g. Tier 1 - Exemplary Delivery / High Impact)"
    },
    "guestEvaluation": {
      "drMaharajaSegmentSynthesis": "string",
      "pedagogicalValue": "string",
      "studentImpactAndRetention": "string",
      "futureGuestRecommendation": "string"
    },
    "internalSummary": {
      "executiveBrief": "string",
      "operationalSuccessHighlights": ["string", "string"],
      "instructionalEfficacy": "string",
      "candidAreasForImprovement": ["string", "string"],
      "actionItemsForOwner": ["string", "string"]
    }
  }
}`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let responseText = '';
    let lastError: any = null;

    for (const model of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt }],
              },
            ],
            config: {
              responseMimeType: 'application/json',
            },
          });
          responseText = response.text || '';
          if (responseText) break;
        } catch (err: any) {
          lastError = err;
          // Short delay on rate limit / 503 spike
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      throw lastError || new Error('No response received from AI model.');
    }
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      // Fallback clean markdown blocks if any
      const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    const bundle = {
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      generatedAt: new Date().toISOString(),
      inputs: {
        feedbackGiverName,
        sessionNotes,
        guestInsights,
        sessionRating,
        starRating,
        sessionDate: sessionDate || new Date().toISOString().split('T')[0],
        subjectOrGrade: subjectOrGrade || '',
      },
      analysis: parsedData.analysis,
      studentParentReport: parsedData.studentParentReport,
      ownerExecutiveReport: parsedData.ownerExecutiveReport,
    };

    res.json({ success: true, bundle });
  } catch (error: any) {
    console.error('Error generating reports:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate session reports via AI service.',
    });
  }
});

// 4. Server-side Drive Export fallback route
app.post('/api/drive/export', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const { htmlContent, fileName } = req.body;

    if (!htmlContent || !fileName) {
      return res.status(400).json({ error: 'htmlContent and fileName are required.' });
    }

    // Call Google Drive API
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: 'text/html',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
      htmlContent +
      closeDelimiter;

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return res.status(uploadRes.status).json({ error: errText });
    }

    const fileData = await uploadRes.json();
    res.json({
      success: true,
      fileId: fileData.id,
      fileUrl: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
      fileName: fileData.name,
    });
  } catch (error: any) {
    console.error('Drive export error:', error);
    res.status(500).json({ error: error?.message || 'Failed to export to Google Drive.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tutor Session Feedback server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
