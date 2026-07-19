'use client';

import { useCallback, useRef, useState } from 'react';

interface UseAudioRecorderOptions {
  maxDurationSeconds: number;
}

export function useAudioRecorder({ maxDurationSeconds }: UseAudioRecorderOptions) {
  const [recording, setRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];
    setBlob(null);
    setElapsedSeconds(0);

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      setBlob(new Blob(chunksRef.current, { type: 'audio/webm' }));
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.start();
    setRecording(true);

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= maxDurationSeconds) {
          recorder.stop();
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRecording(false);
        }
        return next;
      });
    }, 1000);
  }, [maxDurationSeconds]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecording(false);
  }, []);

  return { start, stop, recording, elapsedSeconds, blob };
}
