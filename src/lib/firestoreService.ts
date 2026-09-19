import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './auth';
import { StudentFeedbackInput, FeedbackSubmission } from '../types';

const COLLECTION_NAME = 'feedback_submissions';

export async function submitStudentFeedback(input: StudentFeedbackInput): Promise<{ id: string }> {
  const docPayload = {
    ...input,
    createdAt: new Date().toISOString(),
  };

  // 1. Save directly to Firestore
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docPayload);
    // Also backup to server
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: docRef.id, ...docPayload }),
    }).catch((err) => console.warn('Server backup sync error:', err));

    return { id: docRef.id };
  } catch (firestoreErr) {
    console.warn('Direct Firestore save failed, using server fallback:', firestoreErr);
    // 2. Fallback to server API endpoint
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docPayload),
    });
    if (!res.ok) {
      throw new Error('Failed to record student feedback. Please check connection.');
    }
    const data = await res.json();
    return { id: data.id || `sub_${Date.now()}` };
  }
}

export function subscribeToSubmissions(
  callback: (submissions: FeedbackSubmission[]) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: FeedbackSubmission[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            studentName: data.studentName || 'Anonymous',
            classDepartment: data.classDepartment || '',
            collegeName: data.collegeName || '',
            sessionFeedback: data.sessionFeedback || '',
            overallSatisfaction: data.overallSatisfaction || 'Satisfied',
            areasOfImprovement: data.areasOfImprovement || '',
            starRating: Number(data.starRating) || 5,
            resourcePersonScore: Number(data.resourcePersonScore) || 9,
            suggestions: data.suggestions || '',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });
        callback(items);
      },
      async (err) => {
        console.warn('Firestore snapshot error (falling back to server endpoint):', err);
        if (onError) onError(err);
        // Fallback fetch
        const fallbackItems = await fetchSubmissionsFromServer();
        callback(fallbackItems);
      }
    );
  } catch (err) {
    console.warn('Error initiating Firestore snapshot:', err);
    fetchSubmissionsFromServer().then(callback);
    return () => {};
  }
}

export async function fetchSubmissionsFromServer(): Promise<FeedbackSubmission[]> {
  try {
    const res = await fetch('/api/feedback');
    if (res.ok) {
      const data = await res.json();
      return data.submissions || [];
    }
  } catch (e) {
    console.error('Failed to fetch submissions from server:', e);
  }
  return [];
}

export async function submitFeedbackToFirestore(input: StudentFeedbackInput): Promise<string> {
  const res = await submitStudentFeedback(input);
  return res.id;
}

export async function fetchFeedbackSubmissions(): Promise<FeedbackSubmission[]> {
  return fetchSubmissionsFromServer();
}
