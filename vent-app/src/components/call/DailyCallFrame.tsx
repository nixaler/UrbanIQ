'use client';

import { useEffect, useRef } from 'react';
import DailyIframe, { type DailyCall } from '@daily-co/daily-js';

interface DailyCallFrameProps {
  roomUrl: string;
  token: string;
  muteLocalAudio: boolean;
  onJoinedMeeting: () => void;
  onLeftMeeting: () => void;
}

// Wraps Daily's prebuilt call UI (iframe) rather than the headless call
// object — the app only needs to overlay a timer/decision UI around a
// working 2-person call, not build custom video tile rendering.
export function DailyCallFrame({
  roomUrl,
  token,
  muteLocalAudio,
  onJoinedMeeting,
  onLeftMeeting,
}: DailyCallFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const call = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: true,
      iframeStyle: { width: '100%', height: '100%', border: '0' },
    });
    callRef.current = call;

    call.on('joined-meeting', onJoinedMeeting);
    call.on('left-meeting', onLeftMeeting);

    call.join({ url: roomUrl, token });

    return () => {
      call.destroy();
      callRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomUrl, token]);

  useEffect(() => {
    callRef.current?.setLocalAudio(!muteLocalAudio);
  }, [muteLocalAudio]);

  return <div ref={containerRef} className="aspect-video w-full overflow-hidden rounded-lg border border-border" />;
}
