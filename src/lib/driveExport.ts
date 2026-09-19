import { ExecutiveReport } from '../types';

export function buildExecutiveReportHtmlDocument(report: ExecutiveReport): string {
  const formattedDate = new Date(report.generatedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${report.reportTitle}</title>
  <style>
    @media print {
      body { background: #fff !important; padding: 0 !important; }
      .document-card { box-shadow: none !important; border: 1px solid #ddd !important; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #0f172a;
      max-width: 900px;
      margin: 0 auto;
      padding: 36px 20px;
      background-color: #f8fafc;
    }
    .document-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header-banner {
      border-bottom: 2px solid #0369a1;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-primary { background-color: #e0f2fe; color: #0369a1; }
    .badge-gold { background-color: #fef3c7; color: #92400e; }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 12px 0 6px 0;
      letter-spacing: -0.02em;
    }
    .subtitle {
      color: #64748b;
      font-size: 14px;
      margin: 0;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin: 24px 0;
    }
    .metric-card {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .metric-card .num {
      font-size: 28px;
      font-weight: 800;
      color: #0369a1;
      line-height: 1.1;
    }
    .metric-card .label {
      font-size: 12px;
      color: #475569;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 28px 0 12px;
      border-left: 4px solid #0284c7;
      padding-left: 12px;
    }
    .callout-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
    }
    .callout-highlight {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .callout-critique {
      background: #fff1f2;
      border-color: #fecdd3;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 14px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 10px 14px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #334155;
    }
    ul {
      padding-left: 20px;
      margin: 8px 0;
    }
    li {
      margin-bottom: 6px;
      color: #334155;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 36px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="document-card">
    <div class="header-banner">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="badge badge-primary">Official Academic Analytics</span>
          <span class="badge badge-gold" style="margin-left: 6px;">Resource Person: Dr. M. Maharaja</span>
          <h1 class="title">${report.reportTitle}</h1>
          <p class="subtitle">Generated on ${formattedDate} | Confidential Executive Brief</p>
        </div>
      </div>
    </div>

    <!-- Core Metrics Overview -->
    <div class="metric-grid">
      <div class="metric-card">
        <div class="num">${report.totalSubmissions}</div>
        <div class="label">Total Student Responses</div>
      </div>
      <div class="metric-card">
        <div class="num">${report.metrics.averageStarRating} / 5.0</div>
        <div class="label">Average Star Rating ★</div>
      </div>
      <div class="metric-card">
        <div class="num">${report.metrics.averageResourcePersonScore} / 10.0</div>
        <div class="label">Resource Person Score</div>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="section-title">Executive Performance Synthesis</div>
    <div class="callout-box">
      <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.7;">
        ${report.executiveSummary}
      </p>
    </div>

    <!-- Lecture Delivery & Pedagogical Evaluation -->
    <div class="section-title">Lecture Quality & Delivery Evaluation</div>
    <p style="font-size: 15px; color: #334155; line-height: 1.7;">
      ${report.lectureDeliveryEvaluation}
    </p>

    <!-- Demographic Distribution by College & Department -->
    <div class="section-title">Demographic Analytics (By College &amp; Class/Department)</div>
    <table>
      <thead>
        <tr>
          <th>College / Institution</th>
          <th>Responses</th>
          <th>Avg Star (★)</th>
          <th>Avg Score (/10)</th>
        </tr>
      </thead>
      <tbody>
        ${report.demographics.byCollege.map((c) => `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.count}</td>
            <td>${c.avgStar} / 5.0</td>
            <td>${c.avgScore} / 10.0</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <table>
      <thead>
        <tr>
          <th>Class / Department</th>
          <th>Responses</th>
          <th>Avg Star (★)</th>
          <th>Avg Score (/10)</th>
        </tr>
      </thead>
      <tbody>
        ${report.demographics.byDepartment.map((d) => `
          <tr>
            <td><strong>${d.name}</strong></td>
            <td>${d.count}</td>
            <td>${d.avgStar} / 5.0</td>
            <td>${d.avgScore} / 10.0</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Positive Highlights & Key Takeaways -->
    <div class="section-title" style="border-left-color: #16a34a;">Positive Highlights &amp; Teaching Wins</div>
    <div class="callout-box callout-highlight">
      <ul>
        ${report.positiveKeyTakeaways.map((t) => `<li><strong>${t}</strong></li>`).join('')}
      </ul>
    </div>

    <!-- Critical Areas for Improvement -->
    <div class="section-title" style="border-left-color: #e11d48;">Critical Areas for Improvement &amp; Pacing</div>
    <div class="callout-box callout-critique">
      <ul>
        ${report.criticalAreasForImprovement.map((a) => `<li>${a}</li>`).join('')}
      </ul>
    </div>

    <!-- Curated Student Suggestions -->
    <div class="section-title">Curated Student Suggestions</div>
    <ul>
      ${report.curatedStudentSuggestions.map((s) => `<li>${s}</li>`).join('')}
    </ul>

    <!-- Strategic Recommendations -->
    <div class="section-title" style="border-left-color: #7c3aed;">Strategic Recommendations for Dr. M. Maharaja</div>
    <div class="callout-box" style="background: #faf5ff; border-color: #e9d5ff;">
      <ul>
        ${report.strategicRecommendationsForProfessor.map((r) => `<li><strong>${r}</strong></li>`).join('')}
      </ul>
    </div>

    <div class="footer">
      Dr. M. Maharaja's Session Feedback System &bull; Automatically Synced to Google Drive
    </div>
  </div>
</body>
</html>`;
}

export async function uploadExecutiveReportToGoogleDrive(
  report: ExecutiveReport,
  accessToken: string
): Promise<{ fileId: string; fileUrl: string; fileName: string }> {
  const htmlContent = buildExecutiveReportHtmlDocument(report);
  const cleanDate = new Date(report.generatedAt).toISOString().split('T')[0];
  const fileName = `Dr_M_Maharaja_Executive_Report_${cleanDate}.html`;

  const folderName = 'Dr. M. Maharaja Session Reports';

  // Step A: Search for or create folder
  let folderId: string | undefined;
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        folderId = searchData.files[0].id;
      }
    }
  } catch (err) {
    console.warn('Folder search failed, defaulting to root:', err);
  }

  // Create folder if not found
  if (!folderId) {
    try {
      const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });
      if (createFolderRes.ok) {
        const folderData = await createFolderRes.json();
        folderId = folderData.id;
      }
    } catch (err) {
      console.warn('Folder creation failed, uploading to root:', err);
    }
  }

  // Step B: Multipart upload
  const metadata: Record<string, unknown> = {
    name: fileName,
    mimeType: 'text/html',
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

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
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Google Drive API error (${uploadRes.status}): ${errorText}`);
  }

  const fileData = await uploadRes.json();
  return {
    fileId: fileData.id,
    fileUrl: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
    fileName,
  };
}
