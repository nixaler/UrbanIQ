'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LISTENER_QUIZ } from '@/lib/config/listenerQuiz';

const CRASH_COURSE_POINTS = [
  'Validate, don\'t just solve. "That sounds incredibly frustrating" lands better than "You should just quit your job."',
  'Keep it confidential — what\'s shared in a vent stays private, always.',
  "Recognize red flags. You're a peer, not a crisis counselor — it's okay to hand off to real crisis resources.",
];

export function ListenerAcademyQuiz() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = LISTENER_QUIZ.every((q) => answers[q.id]);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/listener-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      setResult(data);
      if (data.passed) {
        setTimeout(() => router.push('/queue'), 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setAnswers({});
    setResult(null);
  }

  if (result) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-bg-raised p-4 text-center">
        <p className="text-lg font-medium">
          {result.passed ? "You're certified!" : `You got ${result.score}/${result.total}`}
        </p>
        {result.passed ? (
          <p className="text-sm text-ink-muted">Taking you to the listening queue…</p>
        ) : (
          <>
            <p className="text-sm text-ink-muted">
              This is a comprehension check, not a one-shot exam — take another look and try again.
            </p>
            <button type="button" onClick={retry} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white">
              Try again
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-lg border border-border bg-bg-raised p-4 text-sm">
        <p className="font-medium">The 3-minute crash course</p>
        <ul className="list-disc space-y-1 pl-5 text-ink-muted">
          {CRASH_COURSE_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>

      {LISTENER_QUIZ.map((question) => (
        <div key={question.id} className="space-y-2">
          <p className="text-sm font-medium">{question.scenario}</p>
          <div className="space-y-1">
            {question.options.map((option) => (
              <label key={option.id} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={question.id}
                  checked={answers[question.id] === option.id}
                  onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                  className="mt-1"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={!allAnswered || submitting}
        onClick={submit}
        className="w-full rounded-md bg-accent py-2 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Checking…' : 'Submit'}
      </button>
    </div>
  );
}
