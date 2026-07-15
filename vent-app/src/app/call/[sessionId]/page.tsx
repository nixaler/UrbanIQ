'use client';

import { use, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { useDailyToken } from '@/hooks/useDailyToken';
import { useVentTimer } from '@/hooks/useVentTimer';
import { DailyCallFrame } from '@/components/call/DailyCallFrame';
import { Timer } from '@/components/call/Timer';
import { DecisionButtons } from '@/components/call/DecisionButtons';
import { ExtendConsentBanner } from '@/components/call/ExtendConsentBanner';
import { ReportModal } from '@/components/call/ReportModal';
import { CrisisResourcesModal } from '@/components/call/CrisisResourcesModal';

export default function CallPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  const { data, isLoading } = useSession(sessionId);
  const session = data?.session;

  const [reportOpen, setReportOpen] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const endCalledRef = useRef(false);

  const isVenter = !!session && session.venterId === userId;
  const isListener = !!session && session.listenerId === userId;
  const otherUserId = isVenter ? session?.listenerId ?? null : session?.venterId ?? null;

  const { data: tokenData } = useDailyToken(sessionId, session?.dailyRoomUrl ?? null);

  const isLiveCall = session?.status === 'venting' || session?.status === 'matched' || session?.status === 'extended';
  const { secondsRemaining, expired } = useVentTimer({
    ventStartedAt: session?.status === 'extended' ? null : session?.ventStartedAt ?? null,
    ventDurationSeconds: session?.ventDurationSeconds ?? 60,
    onExpire: async () => {
      if (endCalledRef.current) return;
      endCalledRef.current = true;
      await fetch(`/api/session/${sessionId}/end`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });

  async function handleJoinedMeeting() {
    if (session?.status === 'matched') {
      await fetch(`/api/session/${sessionId}/vent-start`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    }
  }

  async function handleLeftMeeting() {
    if (session?.status === 'extended') {
      await fetch(`/api/session/${sessionId}/extend/end`, { method: 'POST' });
    }
  }

  async function handleDecision(decision: 'send_support' | 'follow_issue') {
    setSubmitting(true);
    try {
      await fetch(`/api/session/${sessionId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      router.push(`/post-call/${sessionId}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExtendRequest() {
    setSubmitting(true);
    try {
      await fetch(`/api/session/${sessionId}/extend/request`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExtendRespond(accept: boolean) {
    setSubmitting(true);
    try {
      await fetch(`/api/session/${sessionId}/extend/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      if (!accept) router.push(`/post-call/${sessionId}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || !session) {
    return <p className="text-ink-muted">Loading call…</p>;
  }

  if (session.status === 'completed') {
    router.replace(`/post-call/${sessionId}`);
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {isVenter ? 'You are venting' : 'You are listening'}
          {session.status === 'extended' ? ' — open-ended call' : ''}
        </p>
        <div className="flex gap-3 text-sm">
          <button type="button" onClick={() => setCrisisOpen(true)} className="text-critical underline">
            Crisis help
          </button>
          {otherUserId && (
            <button type="button" onClick={() => setReportOpen(true)} className="text-ink-muted underline">
              Report
            </button>
          )}
        </div>
      </div>

      {isVenter && session.status === 'matched' && (
        <div className="rounded-md border border-critical/40 bg-bg-raised p-2 text-xs text-ink-muted">
          If you&apos;re in crisis right now, tap &quot;Crisis help&quot; above before you start.
        </div>
      )}

      {tokenData && (
        <DailyCallFrame
          roomUrl={tokenData.roomUrl}
          token={tokenData.token}
          muteLocalAudio={isVenter && expired && session.status !== 'extended'}
          onJoinedMeeting={handleJoinedMeeting}
          onLeftMeeting={handleLeftMeeting}
        />
      )}

      {isLiveCall && session.status !== 'extended' && (
        <Timer secondsRemaining={secondsRemaining} totalSeconds={session.ventDurationSeconds} />
      )}

      {session.status === 'awaiting_decision' && isListener && (
        <DecisionButtons
          submitting={submitting}
          onSendSupport={() => handleDecision('send_support')}
          onExtendCall={handleExtendRequest}
          onFollowIssue={() => handleDecision('follow_issue')}
        />
      )}
      {session.status === 'awaiting_decision' && isVenter && (
        <p className="text-sm text-ink-muted">Waiting for the listener&apos;s response…</p>
      )}

      {(session.status === 'extend_requested') && (
        <ExtendConsentBanner
          isRequester={session.extendRequestedBy === userId}
          submitting={submitting}
          onAccept={() => handleExtendRespond(true)}
          onDecline={() => handleExtendRespond(false)}
        />
      )}

      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        sessionId={sessionId}
        reportedUserId={otherUserId ?? ''}
      />
      <CrisisResourcesModal open={crisisOpen} onOpenChange={setCrisisOpen} />
    </div>
  );
}
