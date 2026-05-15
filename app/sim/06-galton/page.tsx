'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SimLayout from '@/components/SimLayout';

const W = 520, H = 500;
const TOP = 44, PIN_H = 240, BIN_TOP_PAD = 14;
const SPEED_MAP = [0.008, 0.016, 0.028, 0.042, 0.06, 0.085, 0.12, 0.16, 0.22, 0.35];

function pinX(rows: number, row: number, col: number) {
  const sp = Math.min(34, (W - 60) / (rows + 1));
  return W / 2 + (col - row / 2) * sp;
}
function pinY(rows: number, row: number) {
  return TOP + (row / rows) * PIN_H;
}

type Ball = { x: number; y: number; row: number; col: number; progress: number; goRight: boolean };
type Sim = {
  rows: number; ballCount: number; speed: number; bias: number;
  bins: number[]; activeBalls: Ball[];
  totalDropped: number; frameCount: number; running: boolean;
};

export default function GaltonPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const sim = useRef<Sim>({
    rows: 12, ballCount: 200, speed: 5, bias: 0.5,
    bins: new Array(13).fill(0), activeBalls: [],
    totalDropped: 0, frameCount: 0, running: false,
  });

  const [rows, setRows] = useState(12);
  const [ballCount, setBallCount] = useState(200);
  const [speed, setSpeed] = useState(5);
  const [bias, setBias] = useState(0.5);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState('');

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s = sim.current;
    const r = s.rows;
    const binAreaTop = TOP + PIN_H + BIN_TOP_PAD;
    const binAreaH = H - binAreaTop - 24;
    const sp = Math.min(34, (W - 60) / (r + 1));
    const binW = sp * 0.72;
    const maxCount = Math.max(...s.bins, 1);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    // Bins
    for (let i = 0; i <= r; i++) {
      const bx = pinX(r, r, i) - binW / 2;
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(bx, binAreaTop, binW, binAreaH);
      if (s.bins[i] > 0) {
        const bh = (s.bins[i] / maxCount) * binAreaH;
        const by = binAreaTop + binAreaH - bh;
        const alpha = 0.3 + 0.7 * (s.bins[i] / maxCount);
        ctx.fillStyle = `rgba(83,74,183,${alpha.toFixed(2)})`;
        ctx.fillRect(bx, by, binW, bh);
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(s.bins[i]), pinX(r, r, i), by - 3);
      }
    }

    // X-axis labels
    ctx.fillStyle = '#aaa';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= r; i++) {
      ctx.fillText(String(i - Math.floor(r / 2)), pinX(r, r, i), H - 6);
    }

    // Drop arrow
    ctx.beginPath();
    ctx.moveTo(W / 2 - 6, TOP - 18);
    ctx.lineTo(W / 2 + 6, TOP - 18);
    ctx.lineTo(W / 2, TOP - 6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(83,74,183,0.55)';
    ctx.fill();

    // Pins
    for (let row = 0; row < r; row++) {
      for (let col = 0; col <= row; col++) {
        ctx.beginPath();
        ctx.arc(pinX(r, row, col), pinY(r, row), 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#bbb';
        ctx.fill();
      }
    }

    // Active balls
    for (const b of s.activeBalls) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(83,74,183,0.9)';
      ctx.fill();
    }
  }, []);

  const calcStats = useCallback(() => {
    const s = sim.current;
    const n = s.bins.reduce((a, b) => a + b, 0);
    if (!n) { setStats(''); return; }
    let mean = 0;
    for (let i = 0; i <= s.rows; i++) mean += i * s.bins[i];
    mean /= n;
    let m2 = 0;
    for (let i = 0; i <= s.rows; i++) m2 += s.bins[i] * (i - mean) ** 2;
    const std = Math.sqrt(m2 / n);
    setStats(`투하: ${n}개 · 평균(중심 기준): ${(mean - s.rows / 2).toFixed(2)} · 표준편차: ${std.toFixed(2)}`);
  }, []);

  const step = useCallback(() => {
    const s = sim.current;
    const spd = SPEED_MAP[s.speed - 1];
    const spawnEvery = Math.max(1, Math.round(0.4 / spd));

    s.frameCount++;
    if (s.totalDropped < s.ballCount && s.frameCount % spawnEvery === 0) {
      s.activeBalls.push({
        x: W / 2, y: TOP - 12, row: 0, col: 0, progress: 0,
        goRight: Math.random() < s.bias,
      });
      s.totalDropped++;
    }

    const next: Ball[] = [];
    for (const b of s.activeBalls) {
      b.progress += spd * 3;
      if (b.progress >= 1) {
        if (b.goRight) b.col++;
        b.row++;
        b.progress = 0;
        if (b.row >= s.rows) {
          s.bins[b.col] = (s.bins[b.col] || 0) + 1;
          calcStats();
        } else {
          b.goRight = Math.random() < s.bias;
          b.x = pinX(s.rows, b.row, b.col);
          b.y = pinY(s.rows, b.row);
          next.push(b);
        }
      } else {
        const t = b.progress;
        const x0 = pinX(s.rows, b.row, b.col);
        const y0 = pinY(s.rows, b.row);
        const x1 = pinX(s.rows, b.row + 1, b.goRight ? b.col + 1 : b.col);
        const y1 = pinY(s.rows, b.row + 1);
        b.x = x0 + (x1 - x0) * t;
        b.y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 5;
        next.push(b);
      }
    }
    s.activeBalls = next;
    draw();

    if (next.length > 0 || s.totalDropped < s.ballCount) {
      rafRef.current = requestAnimationFrame(step);
    } else {
      s.running = false;
      setRunning(false);
    }
  }, [draw, calcStats]);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const s = sim.current;
    s.bins = new Array(s.rows + 1).fill(0);
    s.activeBalls = [];
    s.totalDropped = 0;
    s.frameCount = 0;
    s.running = false;
    setRunning(false);
    setStats('');
    draw();
  }, [draw]);

  // Sync sliders → stateRef
  useEffect(() => { sim.current.ballCount = ballCount; }, [ballCount]);
  useEffect(() => { sim.current.speed = speed; }, [speed]);
  useEffect(() => { sim.current.bias = bias; }, [bias]);
  useEffect(() => { sim.current.rows = rows; reset(); }, [rows, reset]);

  useEffect(() => { draw(); }, [draw]);

  function toggleStart() {
    const s = sim.current;
    if (s.running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      s.running = false;
      setRunning(false);
    } else {
      if (s.totalDropped >= s.ballCount) reset();
      s.running = true;
      setRunning(true);
      rafRef.current = requestAnimationFrame(step);
    }
  }

  const SLIDERS = [
    { label: '구슬 수', display: `${ballCount}개`, min: 10, max: 1000, step: 10, val: ballCount, set: setBallCount },
    { label: '핀 행 수', display: `${rows}행`, min: 4, max: 20, step: 1, val: rows, set: setRows },
    { label: '속도', display: String(speed), min: 1, max: 10, step: 1, val: speed, set: setSpeed },
    { label: '편향 (p = 오른쪽)', display: `p = ${bias.toFixed(2)}`, min: 0.1, max: 0.9, step: 0.05, val: bias, set: setBias },
  ];

  return (
    <SimLayout title="06 — 갈톤보드" description="구슬이 핀을 거쳐 이항분포를 형성합니다. 행이 많을수록 정규분포에 가까워집니다.">
      <div className="grid grid-cols-2 gap-3 mb-5">
        {SLIDERS.map(({ label, display, min, max, step, val, set }) => (
          <div key={label} className="bg-[#f5f5f5] rounded-lg p-3">
            <p className="text-xs text-[#666] mb-0.5">{label}</p>
            <p className="text-sm font-medium mb-1.5">{display}</p>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={(e) => set(+e.target.value as never)} className="w-full" />
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={toggleStart}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#111] text-white hover:opacity-85">
          {running ? '정지' : '시작'}
        </button>
        <button onClick={reset}
          className="border border-black/15 rounded-lg px-4 py-2 text-sm hover:bg-[#f0f0f0]">
          초기화
        </button>
      </div>

      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-lg border border-black/10" />
      {stats && <p className="text-xs text-[#666] mt-2">{stats}</p>}
    </SimLayout>
  );
}
