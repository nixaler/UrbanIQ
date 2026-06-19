import { useEffect, useRef, useState } from 'react';

interface EraAudioParams {
  oscFreq: number;
  filterFreq: number;
  gainVal: number;
  oscType: OscillatorType;
}

function getAudioParams(year: number): EraAudioParams {
  if (year < 1945) return { oscFreq: 55,  filterFreq: 350, gainVal: 0.022, oscType: 'sine' };
  if (year < 1960) return { oscFreq: 65,  filterFreq: 600, gainVal: 0.018, oscType: 'sine' };
  if (year < 1975) return { oscFreq: 50,  filterFreq: 500, gainVal: 0.025, oscType: 'triangle' };
  if (year < 1990) return { oscFreq: 45,  filterFreq: 280, gainVal: 0.018, oscType: 'sine' };
  if (year < 2005) return { oscFreq: 70,  filterFreq: 450, gainVal: 0.015, oscType: 'sine' };
  return                   { oscFreq: 80,  filterFreq: 700, gainVal: 0.012, oscType: 'sine' };
}

export function useEraAudio(year: number) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef    = useRef<AudioContext | null>(null);
  const oscRef    = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainRef   = useRef<GainNode | null>(null);
  const noiseRef  = useRef<AudioBufferSourceNode | null>(null);

  // Start audio
  useEffect(() => {
    if (!enabled) return;

    const anyWin = window as unknown as Record<string, unknown>;
    const Ctx = (window.AudioContext ?? anyWin['webkitAudioContext']) as typeof AudioContext | undefined;
    if (!Ctx) return;

    const ctx = new Ctx();
    ctxRef.current = ctx;

    const params = getAudioParams(year);

    // White noise source
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noiseRef.current = noise;

    // Low-pass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = params.filterFreq;
    filterRef.current = filter;

    // Noise gain
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0;
    noiseGain.gain.linearRampToValueAtTime(params.gainVal, ctx.currentTime + 2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();

    // Subtle oscillator
    const osc = ctx.createOscillator();
    osc.type = params.oscType;
    osc.frequency.value = params.oscFreq;
    oscRef.current = osc;

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0;
    oscGain.gain.linearRampToValueAtTime(0.006, ctx.currentTime + 2.5);
    gainRef.current = oscGain;

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();

    return () => {
      try {
        oscGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
        noiseGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
        setTimeout(() => {
          try { osc.stop(); noise.stop(); ctx.close(); } catch {}
        }, 800);
      } catch {}
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update parameters smoothly when era changes
  useEffect(() => {
    const ctx = ctxRef.current;
    const osc = oscRef.current;
    const filter = filterRef.current;
    if (!ctx || !osc || !filter || !enabled) return;

    const params = getAudioParams(year);
    osc.frequency.setTargetAtTime(params.oscFreq, ctx.currentTime, 3);
    filter.frequency.setTargetAtTime(params.filterFreq, ctx.currentTime, 3);
  }, [year, enabled]);

  return {
    enabled,
    toggle: () => setEnabled(e => !e),
  };
}
