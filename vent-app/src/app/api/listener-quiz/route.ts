import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { listenerQuizAttempts, profiles } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { LISTENER_QUIZ, PASSING_SCORE } from '@/lib/config/listenerQuiz';

export const runtime = 'nodejs';

const bodySchema = z.object({ answers: z.record(z.string(), z.string()) });

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const score = LISTENER_QUIZ.reduce((acc, question) => {
    const selectedOptionId = parsed.data.answers[question.id];
    const correctOption = question.options.find((o) => o.correct);
    return acc + (selectedOptionId && selectedOptionId === correctOption?.id ? 1 : 0);
  }, 0);
  const passed = score >= PASSING_SCORE;

  await db.insert(listenerQuizAttempts).values({ userId: profile.id, score, passed });

  if (passed) {
    await db.update(profiles).set({ listenerCertifiedAt: new Date() }).where(eq(profiles.id, profile.id));
  }

  return NextResponse.json({ score, passed, total: LISTENER_QUIZ.length });
}
