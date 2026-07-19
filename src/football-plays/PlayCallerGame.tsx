import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Point, SavedPlay, CareerStats } from './types';
import { FORMATIONS, ROUTE_TEMPLATES, getFormation, generateDefense, pointAtT, lerp, dist, clamp } from './formations';
import { loadPlaybook, savePlaybook, loadCareer, saveCareer, uid, vibrate } from './storage';

interface PlayCallerGameProps {
  onBack: () => void;
}

type Screen = 'menu' | 'formation' | 'draw' | 'playbook';
type SimPhase = 'idle' | 'running' | 'result';
type Outcome = 'complete' | 'incomplete' | 'touchdown' | 'intercepted';

const CHALK = '#f4f1ea';
const BOARD_DARK = '#173625';
const BOARD_LIGHT = '#1f4a30';
const TURF_A = '#2f6b3c';
const TURF_B = '#2a6136';
const YARD_LABELS = [10, 20, 30, 40, 50, 40, 30, 20, 10];
// Football silhouette: full width from 10%-90% of height, pointed tips beyond that.
const FOOTBALL_CLIP_PATH = 'M0.5,0 C0.75,0.01 0.99,0.045 1,0.1 L1,0.9 C0.99,0.955 0.75,0.99 0.5,1 C0.25,0.99 0.01,0.955 0,0.9 L0,0.1 C0.01,0.045 0.25,0.01 0.5,0 Z';
const FOOTBALL_SEAM_PATH = 'M50,0 C75,1.5 99,6.75 100,15 L100,135 C99,143.25 75,148.5 50,150 C25,148.5 1,143.25 0,135 L0,15 C1,6.75 25,1.5 50,0 Z';

function getRelPoint(e: { clientX: number; clientY: number }, el: HTMLDivElement): Point {
  const rect = el.getBoundingClientRect();
  return {
    x: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

function routeSvgPath(waypoints: Point[]): string {
  if (waypoints.length === 0) return '';
  return waypoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export function PlayCallerGame({ onBack }: PlayCallerGameProps) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [formationKey, setFormationKey] = useState<string>(FORMATIONS[0].key);
  const formation = useMemo(() => getFormation(formationKey), [formationKey]);

  const [routes, setRoutes] = useState<Record<string, Point[]>>({});
  const [targetId, setTargetId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [defenders, setDefenders] = useState(() => generateDefense(formation));

  const [simPhase, setSimPhase] = useState<SimPhase>('idle');
  const [simT, setSimT] = useState(0);
  const [result, setResult] = useState<{ outcome: Outcome; yards: number } | null>(null);

  const [career, setCareer] = useState<CareerStats>(() => loadCareer());
  const [session, setSession] = useState({ attempts: 0, completions: 0, touchdowns: 0, yards: 0 });

  const [playbook, setPlaybookState] = useState<SavedPlay[]>(() => loadPlaybook());
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveNameText, setSaveNameText] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const fieldRef = useRef<HTMLDivElement>(null);
  const dragRouteRef = useRef<Point[] | null>(null);
  const dragPlayerIdRef = useRef<string | null>(null);
  const dragMovedRef = useRef(false);
  const dragWasSelectedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  function pickFormation(key: string) {
    const f = getFormation(key);
    setFormationKey(key);
    setRoutes({});
    setTargetId(null);
    setSelectedPlayerId(null);
    setDefenders(generateDefense(f));
    setSimPhase('idle');
    setResult(null);
    setScreen('draw');
    vibrate(8);
  }

  function applyTemplate(templateKey: string) {
    if (!selectedPlayerId) return;
    const p = formation.eligible.find(e => e.id === selectedPlayerId);
    const tpl = ROUTE_TEMPLATES.find(t => t.key === templateKey);
    if (!p || !tpl) return;
    const wps = tpl.build(p.start, formation.losY);
    setRoutes(r => ({ ...r, [p.id]: wps }));
    setTargetId(t => t || p.id);
    setSelectedPlayerId(null);
    vibrate(10);
  }

  function clearRoute(id: string) {
    setRoutes(r => {
      const n = { ...r };
      delete n[id];
      return n;
    });
    setTargetId(t => (t === id ? null : t));
  }

  function clearAllRoutes() {
    setRoutes({});
    setTargetId(null);
    setSelectedPlayerId(null);
  }

  function shuffleDefense() {
    if (simPhase !== 'idle') return;
    setDefenders(generateDefense(formation));
    vibrate(6);
  }

  // ── Freehand drawing ─────────────────────────────────────────────────────
  // A drag can start either directly on a player token (the natural gesture —
  // press the receiver, drag their route) or on empty field space once a
  // player is already selected via tap. Both converge on the same refs so
  // move/up handling is identical regardless of where the drag began.
  function beginDrag(e: React.PointerEvent<HTMLDivElement>, p: { id: string; start: Point }, wasSelected: boolean) {
    if (simPhase !== 'idle' || !fieldRef.current) return;
    dragPlayerIdRef.current = p.id;
    dragMovedRef.current = false;
    dragWasSelectedRef.current = wasSelected;
    try {
      fieldRef.current.setPointerCapture?.(e.pointerId);
    } catch {}
    const pt = getRelPoint(e, fieldRef.current);
    dragRouteRef.current = [p.start, pt];
  }

  function onTokenPointerDown(e: React.PointerEvent<HTMLDivElement>, p: { id: string; start: Point }) {
    if (simPhase !== 'idle') return;
    e.stopPropagation();
    const wasSelected = selectedPlayerId === p.id;
    setSelectedPlayerId(p.id);
    beginDrag(e, p, wasSelected);
  }

  function onFieldPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (simPhase !== 'idle' || !selectedPlayerId || !fieldRef.current) return;
    const p = formation.eligible.find(x => x.id === selectedPlayerId);
    if (!p) return;
    beginDrag(e, p, true);
    e.preventDefault();
  }

  function onFieldPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const pid = dragPlayerIdRef.current;
    if (!pid || !fieldRef.current || !dragRouteRef.current) return;
    const pt = getRelPoint(e, fieldRef.current);
    const last = dragRouteRef.current[dragRouteRef.current.length - 1];
    if (dist(last, pt) > 2.2) {
      dragMovedRef.current = true;
      if (!isDragging) setIsDragging(true);
      dragRouteRef.current.push(pt);
      setRoutes(r => ({ ...r, [pid]: dragRouteRef.current!.slice() }));
    }
    e.preventDefault();
  }

  function onFieldPointerUp() {
    const pid = dragPlayerIdRef.current;
    if (!pid) return;
    if (dragMovedRef.current && dragRouteRef.current && dragRouteRef.current.length >= 2) {
      setTargetId(t => t || pid);
      setSelectedPlayerId(null);
      vibrate(10);
    } else if (dragWasSelectedRef.current) {
      setSelectedPlayerId(null);
    }
    setIsDragging(false);
    dragRouteRef.current = null;
    dragPlayerIdRef.current = null;
  }

  // ── Defender pursuit ─────────────────────────────────────────────────────
  const defenderPosAtT = useCallback(
    (def: { start: Point; markId: string | null }, t: number): Point => {
      if (!def.markId) {
        if (t < 0.25 || !targetId) return def.start;
        const targetRoute = routes[targetId];
        if (!targetRoute) return def.start;
        const chaseT = Math.min(1, (t - 0.25) / 0.6);
        const chasePt = pointAtT(targetRoute, Math.min(1, (t - 0.25) / 0.75));
        return lerp(def.start, chasePt, chaseT);
      }
      const markedRoute = routes[def.markId];
      const anchor = markedRoute
        ? pointAtT(markedRoute, t)
        : formation.eligible.find(e => e.id === def.markId)?.start || def.start;
      return lerp(def.start, anchor, Math.min(1, t * 1.15));
    },
    [routes, targetId, formation]
  );

  function tokenPos(playerId: string, start: Point): Point {
    if (simPhase === 'idle' || !routes[playerId]) return simPhase === 'idle' ? start : pointAtT(routes[playerId] || [start], 1);
    const routeT = Math.min(1, simT / 0.75);
    if (simPhase === 'running') return pointAtT(routes[playerId], routeT);
    return pointAtT(routes[playerId], 1);
  }

  function updateStats(outcome: Outcome, yards: number) {
    setSession(s => ({
      attempts: s.attempts + 1,
      completions: s.completions + (outcome === 'complete' || outcome === 'touchdown' ? 1 : 0),
      touchdowns: s.touchdowns + (outcome === 'touchdown' ? 1 : 0),
      yards: s.yards + yards,
    }));
    setCareer(c => {
      const next: CareerStats = {
        attempts: c.attempts + 1,
        completions: c.completions + (outcome === 'complete' || outcome === 'touchdown' ? 1 : 0),
        touchdowns: c.touchdowns + (outcome === 'touchdown' ? 1 : 0),
        bestYards: Math.max(c.bestYards, yards),
      };
      saveCareer(next);
      return next;
    });
  }

  function finishPlay() {
    if (!targetId) {
      setSimPhase('idle');
      return;
    }
    const targetRoute = routes[targetId];
    const targetStart = formation.eligible.find(e => e.id === targetId)!.start;
    const finalPos = targetRoute ? targetRoute[targetRoute.length - 1] : targetStart;
    const defPositions = defenders.map(d => defenderPosAtT(d, 1));
    const nearestDefDist = defPositions.length ? Math.min(...defPositions.map(p => dist(p, finalPos))) : 20;
    const routeDepth = targetStart.y - finalPos.y;
    const depthDifficulty = clamp(routeDepth / 60, 0, 0.5);
    const chance = clamp(nearestDefDist / 14 - depthDifficulty, 0.06, 0.94);
    const roll = Math.random();

    let outcome: Outcome;
    let yards = 0;
    if (roll < chance) {
      yards = Math.max(1, Math.round(routeDepth * 0.6));
      if (finalPos.y <= 6) {
        outcome = 'touchdown';
        yards = Math.max(yards, Math.round(formation.losY * 0.6));
      } else {
        outcome = 'complete';
      }
    } else if (nearestDefDist < 5 && Math.random() < 0.15) {
      outcome = 'intercepted';
    } else {
      outcome = 'incomplete';
    }

    setResult({ outcome, yards });
    setSimPhase('result');
    updateStats(outcome, yards);
    vibrate(outcome === 'touchdown' ? [30, 40, 30] as any : outcome === 'complete' ? 15 : 25);
  }

  function runPlay() {
    if (!targetId || simPhase !== 'idle') return;
    setSelectedPlayerId(null);
    setSimPhase('running');
    const startTime = performance.now();
    const DURATION = 1500;
    const frame = (now: number) => {
      const t = clamp((now - startTime) / DURATION, 0, 1);
      setSimT(t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        finishPlay();
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  }

  function runAgain() {
    setSimPhase('idle');
    setSimT(0);
    setResult(null);
    setDefenders(generateDefense(formation));
  }

  function newPlay() {
    setRoutes({});
    setTargetId(null);
    setSelectedPlayerId(null);
    setSimPhase('idle');
    setSimT(0);
    setResult(null);
    setDefenders(generateDefense(formation));
  }

  function confirmSave() {
    const name = saveNameText.trim() || `${formation.name} Special`;
    const play: SavedPlay = { id: uid(), name, formationKey, routes, targetId, createdAt: Date.now() };
    const next = [play, ...playbook].slice(0, 30);
    setPlaybookState(next);
    savePlaybook(next);
    setShowSaveInput(false);
    setSaveNameText('');
    showToast(`Saved "${name}" to your playbook!`);
  }

  function loadPlay(play: SavedPlay) {
    const f = getFormation(play.formationKey);
    setFormationKey(play.formationKey);
    setRoutes(play.routes);
    setTargetId(play.targetId);
    setDefenders(generateDefense(f));
    setSimPhase('idle');
    setSimT(0);
    setResult(null);
    setScreen('draw');
  }

  function deletePlay(id: string) {
    const next = playbook.filter(p => p.id !== id);
    setPlaybookState(next);
    savePlaybook(next);
  }

  const routedCount = Object.keys(routes).length;
  const routeT = Math.min(1, simT / 0.75);
  const ballT = clamp((simT - 0.75) / 0.25, 0, 1);
  const ballArc = Math.sin(Math.PI * ballT) * 10;
  const targetPlayer = targetId ? formation.eligible.find(e => e.id === targetId) : null;
  const targetPos = targetPlayer ? tokenPos(targetPlayer.id, targetPlayer.start) : null;
  const qbPos = formation.qb.start;

  // ── MENU ──────────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div style={{ minHeight: '100vh', background: BOARD_DARK, color: CHALK, fontFamily: "'Inter',sans-serif", display: 'flex', flexDirection: 'column' }}>
        <style>{`@keyframes pcFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px' }}>
          <button onClick={onBack} style={{ background: 'transparent', border: '1px solid rgba(244,241,234,0.25)', borderRadius: 6, padding: '7px 14px', color: CHALK, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer' }}>← BACK</button>
          <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.6, fontWeight: 700 }}>THEGUESSINGGAME</div>
        </nav>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 24px 48px', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 6, animation: 'pcFadeIn .4s ease both' }}>🏈</div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(34px,9vw,58px)', letterSpacing: 2, margin: '0 0 8px', animation: 'pcFadeIn .45s .05s ease both' }}>PLAY CALLER</h1>
          <p style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.7, maxWidth: 300, margin: '0 0 32px', animation: 'pcFadeIn .45s .1s ease both' }}>
            You're the quarterback. Pick a formation, trace the route for your receiver with your finger — just like drawing it up on the board — then call your shot and sling it.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320, animation: 'pcFadeIn .45s .15s ease both' }}>
            <button onClick={() => setScreen('formation')} style={{ background: '#e8b400', color: '#1a1a1a', border: 'none', borderRadius: 10, padding: '16px 20px', fontSize: 15, fontWeight: 800, letterSpacing: 0.5, cursor: 'pointer', boxShadow: '0 6px 20px rgba(232,180,0,0.3)' }}>
              🏈 CALL A PLAY
            </button>
            <button onClick={() => setScreen('playbook')} style={{ background: 'rgba(244,241,234,0.08)', color: CHALK, border: '1px solid rgba(244,241,234,0.2)', borderRadius: 10, padding: '14px 20px', fontSize: 14, fontWeight: 700, letterSpacing: 0.5, cursor: 'pointer' }}>
              📖 MY PLAYBOOK{playbook.length > 0 ? ` (${playbook.length})` : ''}
            </button>
          </div>
          {career.attempts > 0 && (
            <div style={{ marginTop: 36, fontSize: 11, letterSpacing: 1.5, opacity: 0.55, animation: 'pcFadeIn .45s .2s ease both' }}>
              🏆 BEST PLAY: {career.bestYards} YDS &nbsp;·&nbsp; TDs: {career.touchdowns} &nbsp;·&nbsp; {career.attempts > 0 ? Math.round((career.completions / career.attempts) * 100) : 0}% COMP
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── FORMATION SELECT ─────────────────────────────────────────────────────
  if (screen === 'formation') {
    return (
      <div style={{ minHeight: '100vh', background: BOARD_DARK, color: CHALK, fontFamily: "'Inter',sans-serif" }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px' }}>
          <button onClick={() => setScreen('menu')} style={{ background: 'transparent', border: '1px solid rgba(244,241,234,0.25)', borderRadius: 6, padding: '7px 14px', color: CHALK, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer' }}>← BACK</button>
          <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.6, fontWeight: 700 }}>PICK YOUR FORMATION</div>
        </nav>
        <div style={{ padding: '10px 18px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 560, margin: '0 auto' }}>
          {FORMATIONS.map(f => (
            <div key={f.key} onClick={() => pickFormation(f.key)}
              style={{ background: BOARD_LIGHT, border: '1px solid rgba(244,241,234,0.15)', borderRadius: 14, padding: '18px 14px', cursor: 'pointer', textAlign: 'center', transition: 'transform .15s,border-color .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e8b400'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(244,241,234,0.15)'; }}
            >
              <div style={{ fontSize: 30, marginBottom: 8 }}>{f.emoji}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 1 }}>{f.name}</div>
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, lineHeight: 1.4 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── PLAYBOOK ──────────────────────────────────────────────────────────────
  if (screen === 'playbook') {
    return (
      <div style={{ minHeight: '100vh', background: BOARD_DARK, color: CHALK, fontFamily: "'Inter',sans-serif" }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px' }}>
          <button onClick={() => setScreen('menu')} style={{ background: 'transparent', border: '1px solid rgba(244,241,234,0.25)', borderRadius: 6, padding: '7px 14px', color: CHALK, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, cursor: 'pointer' }}>← BACK</button>
          <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.6, fontWeight: 700 }}>MY PLAYBOOK</div>
        </nav>
        <div style={{ padding: '10px 18px 40px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {playbook.length === 0 && (
            <div style={{ textAlign: 'center', opacity: 0.55, fontSize: 13, padding: '60px 20px' }}>
              No plays saved yet.<br />Draw a play and hit 💾 Save to build your playbook.
            </div>
          )}
          {playbook.map(play => {
            const f = getFormation(play.formationKey);
            return (
              <div key={play.id} style={{ background: BOARD_LIGHT, border: '1px solid rgba(244,241,234,0.15)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 24 }}>{f.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{play.name}</div>
                  <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{f.name} · {Object.keys(play.routes).length} routes</div>
                </div>
                <button onClick={() => loadPlay(play)} style={{ background: '#e8b400', color: '#1a1a1a', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>RUN</button>
                <button onClick={() => deletePlay(play.id)} style={{ background: 'transparent', border: '1px solid rgba(244,241,234,0.2)', color: CHALK, borderRadius: 8, padding: '8px 10px', fontSize: 12, cursor: 'pointer' }}>🗑</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DRAW / RUN SCREEN ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BOARD_DARK, color: CHALK, fontFamily: "'Inter',sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes pcToastIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
        @keyframes pcResultIn{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes pcPulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.12)}}`}</style>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', flexWrap: 'wrap', gap: 8 }}>
        <button onClick={() => setScreen('formation')} style={{ background: 'transparent', border: '1px solid rgba(244,241,234,0.25)', borderRadius: 6, padding: '6px 12px', color: CHALK, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, cursor: 'pointer' }}>← FORMATION</button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: 1 }}>{formation.emoji} {formation.name}</div>
        <button onClick={() => setScreen('playbook')} style={{ background: 'transparent', border: '1px solid rgba(244,241,234,0.25)', borderRadius: 6, padding: '6px 12px', color: CHALK, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, cursor: 'pointer' }}>📖</button>
      </nav>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, padding: '0 16px 8px', fontSize: 10, letterSpacing: 1, opacity: 0.7, flexWrap: 'wrap' }}>
        <span>ATT {session.attempts}</span>
        <span>COMP {session.completions}</span>
        <span>YDS {session.yards}</span>
        <span>TD {session.touchdowns}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 12px' }}>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <clipPath id="pcFootballClip" clipPathUnits="objectBoundingBox">
              <path d={FOOTBALL_CLIP_PATH} />
            </clipPath>
          </defs>
        </svg>
        <div style={{ position: 'relative', width: '100%', maxWidth: 420, aspectRatio: '2 / 3' }}>
          {/* leather football shell */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg,#9a5a26,#6b3410 55%,#4a2409)',
            clipPath: 'url(#pcFootballClip)', WebkitClipPath: 'url(#pcFootballClip)',
            boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
          }} />
          {/* turf field, inset inside the leather shell, same football silhouette */}
          <div
            ref={fieldRef}
            onPointerDown={onFieldPointerDown}
            onPointerMove={onFieldPointerMove}
            onPointerUp={onFieldPointerUp}
            onPointerCancel={onFieldPointerUp}
            style={{
              position: 'absolute',
              inset: '4.5% 8%',
              background: TURF_A,
              clipPath: 'url(#pcFootballClip)', WebkitClipPath: 'url(#pcFootballClip)',
              touchAction: 'none',
              userSelect: 'none',
              cursor: selectedPlayerId ? 'crosshair' : 'default',
            }}
          >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <marker id="pcArrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#ffdd55" />
              </marker>
            </defs>
            {/* mowed turf stripes */}
            {Array.from({ length: 10 }).map((_, i) => (
              <rect key={`turf${i}`} x={0} y={i * 10} width={100} height={10} fill={i % 2 === 0 ? TURF_A : TURF_B} />
            ))}
            {/* end zone */}
            <rect x={0} y={0} width={100} height={6} fill="rgba(10,30,18,0.55)" />
            {/* hash marks */}
            {Array.from({ length: 19 }).map((_, i) => (
              <React.Fragment key={`hash${i}`}>
                <line x1={41} y1={i * 5 + 3} x2={44} y2={i * 5 + 3} stroke="rgba(244,241,234,0.4)" strokeWidth={0.35} />
                <line x1={56} y1={i * 5 + 3} x2={59} y2={i * 5 + 3} stroke="rgba(244,241,234,0.4)" strokeWidth={0.35} />
              </React.Fragment>
            ))}
            {/* yard lines + numbers */}
            {Array.from({ length: 9 }).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={0} y1={(i + 1) * 10} x2={100} y2={(i + 1) * 10} stroke="rgba(244,241,234,0.55)" strokeWidth={0.35} />
                <text x={6} y={(i + 1) * 10 - 1.5} fontSize={3.4} fill="rgba(244,241,234,0.55)" fontFamily="'Bebas Neue',sans-serif">{YARD_LABELS[i]}</text>
                <text x={94} y={(i + 1) * 10 - 1.5} fontSize={3.4} fill="rgba(244,241,234,0.55)" fontFamily="'Bebas Neue',sans-serif" textAnchor="end">{YARD_LABELS[i]}</text>
              </React.Fragment>
            ))}
            {/* goal line */}
            <line x1={0} y1={6} x2={100} y2={6} stroke="rgba(244,241,234,0.7)" strokeWidth={0.8} />
            {/* line of scrimmage */}
            <line x1={0} y1={formation.losY} x2={100} y2={formation.losY} stroke="#ffdd55" strokeWidth={0.6} strokeOpacity={0.8} />
            {/* routes */}
            {formation.eligible.map(p => {
              const wps = routes[p.id];
              if (!wps || wps.length < 2) return null;
              const isTarget = targetId === p.id;
              return (
                <path
                  key={p.id}
                  d={routeSvgPath(wps)}
                  fill="none"
                  stroke={isTarget ? '#ffdd55' : 'rgba(244,241,234,0.75)'}
                  strokeWidth={isTarget ? 0.9 : 0.7}
                  strokeDasharray="2.2,1.6"
                  strokeLinecap="round"
                  markerEnd="url(#pcArrow)"
                />
              );
            })}
            {/* ball flight arc (visual only, drawn as small dashed guide once thrown) */}
            {simPhase === 'running' && ballT > 0 && targetPos && (
              <line x1={qbPos.x} y1={qbPos.y} x2={targetPos.x} y2={targetPos.y} stroke="rgba(255,221,85,0.3)" strokeWidth={0.4} strokeDasharray="1,1.5" />
            )}
          </svg>

          {/* defenders */}
          {defenders.map(d => {
            const pos = simPhase === 'idle' ? d.start : defenderPosAtT(d, simPhase === 'running' ? routeT : 1);
            return (
              <div key={d.id} style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#e8544a', transition: simPhase === 'idle' ? 'left .3s,top .3s' : undefined }}>
                ✕
              </div>
            );
          })}

          {/* QB */}
          <div style={{ position: 'absolute', left: `${qbPos.x}%`, top: `${qbPos.y}%`, transform: 'translate(-50%,-50%)', width: 30, height: 30, borderRadius: '50%', background: '#3a6b4a', border: '2px solid rgba(244,241,234,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: CHALK }}>
            QB
          </div>

          {/* football during throw */}
          {simPhase !== 'idle' && ballT > 0 && targetPos && (
            <div style={{ position: 'absolute', left: `${lerp(qbPos, targetPos, ballT).x}%`, top: `${lerp(qbPos, targetPos, ballT).y - ballArc}%`, transform: 'translate(-50%,-50%)', fontSize: 14, zIndex: 5 }}>
              🏈
            </div>
          )}

          {/* eligible players */}
          {formation.eligible.map(p => {
            const pos = tokenPos(p.id, p.start);
            const hasRoute = !!routes[p.id];
            const isSelected = selectedPlayerId === p.id;
            const isTarget = targetId === p.id;
            return (
              <div
                key={p.id}
                onPointerDown={e => onTokenPointerDown(e, p)}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: isTarget ? '#e8b400' : hasRoute ? '#3a6b4a' : '#294f36',
                  border: `2px solid ${isSelected ? '#ffffff' : isTarget ? '#fff4c2' : 'rgba(244,241,234,0.55)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 800,
                  color: isTarget ? '#1a1a1a' : CHALK,
                  cursor: simPhase === 'idle' ? 'pointer' : 'default',
                  zIndex: isSelected ? 6 : 4,
                  animation: isSelected ? 'pcPulse 1s ease-in-out infinite' : undefined,
                  touchAction: 'none',
                }}
              >
                {p.label}
              </div>
            );
          })}
          </div>
          {/* laces + seam, decorative, sits above the leather but never intercepts touches */}
          <svg viewBox="0 0 100 150" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <path d={FOOTBALL_SEAM_PATH} fill="none" stroke="rgba(244,241,234,0.4)" strokeWidth={0.6} />
            {[2.5, 4.5].map(y => (
              <line key={`lace-top-${y}`} x1={47} y1={y} x2={53} y2={y} stroke="#f4f1ea" strokeWidth={0.9} strokeLinecap="round" />
            ))}
            <line x1={50} y1={1} x2={50} y2={6} stroke="#f4f1ea" strokeWidth={0.7} />
            {[145.5, 147.5].map(y => (
              <line key={`lace-bot-${y}`} x1={47} y1={y} x2={53} y2={y} stroke="#f4f1ea" strokeWidth={0.9} strokeLinecap="round" />
            ))}
            <line x1={50} y1={144} x2={50} y2={149} stroke="#f4f1ea" strokeWidth={0.7} />
          </svg>
        </div>

        {/* selected player route chips */}
        {selectedPlayerId && simPhase === 'idle' && (
          <div style={{ width: '100%', maxWidth: 420, marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {ROUTE_TEMPLATES.map(tpl => (
              <button key={tpl.key} onClick={() => applyTemplate(tpl.key)} style={{ background: 'rgba(244,241,234,0.1)', border: '1px solid rgba(244,241,234,0.25)', color: CHALK, borderRadius: 20, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {tpl.emoji} {tpl.name}
              </button>
            ))}
            <span style={{ fontSize: 10, opacity: 0.6, alignSelf: 'center', marginLeft: 4 }}>or drag on the field ✍️</span>
          </div>
        )}

        {/* controls */}
        {simPhase === 'idle' && (
          <div style={{ width: '100%', maxWidth: 420, marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', paddingBottom: 24 }}>
            <button onClick={shuffleDefense} style={{ background: 'rgba(244,241,234,0.08)', border: '1px solid rgba(244,241,234,0.2)', color: CHALK, borderRadius: 8, padding: '10px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🔀 Shuffle D</button>
            <button onClick={clearAllRoutes} disabled={routedCount === 0} style={{ background: 'rgba(244,241,234,0.08)', border: '1px solid rgba(244,241,234,0.2)', color: CHALK, borderRadius: 8, padding: '10px 14px', fontSize: 11, fontWeight: 700, cursor: routedCount === 0 ? 'default' : 'pointer', opacity: routedCount === 0 ? 0.4 : 1 }}>↩ Clear Routes</button>
            <button onClick={runPlay} disabled={!targetId} style={{ background: targetId ? '#e8b400' : 'rgba(244,241,234,0.15)', color: targetId ? '#1a1a1a' : 'rgba(244,241,234,0.5)', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 800, cursor: targetId ? 'pointer' : 'default', letterSpacing: 0.5 }}>▶ RUN IT</button>
          </div>
        )}

        {routedCount > 0 && simPhase === 'idle' && (
          <div style={{ width: '100%', maxWidth: 420, marginTop: 2, marginBottom: 10, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {formation.eligible.filter(p => routes[p.id]).map(p => (
              <div key={p.id} onClick={() => setTargetId(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: targetId === p.id ? 'rgba(232,180,0,0.2)' : 'rgba(244,241,234,0.06)', border: `1px solid ${targetId === p.id ? '#e8b400' : 'rgba(244,241,234,0.15)'}`, borderRadius: 20, padding: '5px 10px 5px 6px', fontSize: 10, cursor: 'pointer' }}>
                <span style={{ fontWeight: 800 }}>{targetId === p.id ? '🎯' : ''} {p.label}</span>
                <span onClick={e => { e.stopPropagation(); clearRoute(p.id); }} style={{ opacity: 0.6, fontWeight: 700 }}>✕</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* result overlay */}
      {simPhase === 'result' && result && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: BOARD_LIGHT, borderTop: '1px solid rgba(244,241,234,0.2)', borderRadius: '18px 18px 0 0', padding: '24px 24px 32px', width: '100%', maxWidth: 480, textAlign: 'center', animation: 'pcResultIn .3s ease both' }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>
              {result.outcome === 'touchdown' ? '🎉' : result.outcome === 'complete' ? '✅' : result.outcome === 'intercepted' ? '🛑' : '❌'}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 1, color: result.outcome === 'touchdown' ? '#ffdd55' : CHALK }}>
              {result.outcome === 'touchdown' ? 'TOUCHDOWN!!' : result.outcome === 'complete' ? 'COMPLETE!' : result.outcome === 'intercepted' ? 'INTERCEPTED!' : 'INCOMPLETE'}
            </div>
            {(result.outcome === 'complete' || result.outcome === 'touchdown') && (
              <div style={{ fontSize: 14, opacity: 0.75, marginTop: 4 }}>+{result.yards} yards</div>
            )}

            {!showSaveInput ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 }}>
                <button onClick={runAgain} style={{ background: 'rgba(244,241,234,0.1)', border: '1px solid rgba(244,241,234,0.25)', color: CHALK, borderRadius: 8, padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>↻ Run Again</button>
                <button onClick={newPlay} style={{ background: 'rgba(244,241,234,0.1)', border: '1px solid rgba(244,241,234,0.25)', color: CHALK, borderRadius: 8, padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🆕 New Play</button>
                <button onClick={() => setShowSaveInput(true)} style={{ background: '#e8b400', color: '#1a1a1a', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>💾 Save Play</button>
              </div>
            ) : (
              <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <input
                  autoFocus
                  value={saveNameText}
                  onChange={e => setSaveNameText(e.target.value)}
                  placeholder="Name this play..."
                  maxLength={30}
                  style={{ background: 'rgba(244,241,234,0.1)', border: '1px solid rgba(244,241,234,0.3)', borderRadius: 8, padding: '10px 12px', color: CHALK, fontSize: 13, width: 180 }}
                />
                <button onClick={confirmSave} style={{ background: '#e8b400', color: '#1a1a1a', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Save</button>
                <button onClick={() => setShowSaveInput(false)} style={{ background: 'transparent', border: '1px solid rgba(244,241,234,0.2)', color: CHALK, borderRadius: 8, padding: '10px 12px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0a0a0a', color: CHALK, padding: '10px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, animation: 'pcToastIn .2s ease both', zIndex: 300 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
