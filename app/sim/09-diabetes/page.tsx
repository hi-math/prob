'use client';

import { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SimLayout from '@/components/SimLayout';
import { rand } from '@/lib/rng';

const BTN = 'border border-black/15 rounded-lg px-4 py-2 text-sm hover:bg-[#f0f0f0] cursor-pointer';

const ROULETTES = {
  A: { 빨강: 1 / 2, 파랑: 1 / 4, 초록: 1 / 4 },
  B: { 빨강: 1 / 3, 파랑: 1 / 3, 초록: 1 / 3 },
  C: { 빨강: 1 / 6, 파랑: 1 / 6, 초록: 4 / 6 },
};

type Color = '빨강' | '파랑' | '초록';
type RouletteKey = 'A' | 'B' | 'C';

function spinRoulette(key: RouletteKey): Color {
  const probs = ROULETTES[key];
  const r = rand();
  let cum = 0;
  for (const [color, p] of Object.entries(probs)) {
    cum += p;
    if (r < cum) return color as Color;
  }
  return '초록';
}

const COLOR_MAP: Record<Color, string> = { 빨강: '#ef4444', 파랑: '#3b82f6', 초록: '#10b981' };

function RouletteViz({ label, probs }: { label: string; probs: Record<Color, number> }) {
  const cx = 50, cy = 50, r = 44;
  let startAngle = -Math.PI / 2;

  const segments = (Object.entries(probs) as [Color, number][]).map(([color, p]) => {
    const sweep = p * 2 * Math.PI;
    const endAngle = startAngle + sweep;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const mid = startAngle + sweep / 2;
    const lx = cx + r * 0.62 * Math.cos(mid);
    const ly = cy + r * 0.62 * Math.sin(mid);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    startAngle = endAngle;
    return { color, p, path, lx, ly };
  });

  return (
    <div className="bg-[#f8f8f6] rounded-xl p-4 flex flex-col items-center">
      <p className="text-sm font-semibold text-[#111] mb-2">룰렛 {label}</p>
      <svg viewBox="0 0 100 100" className="w-28 h-28">
        {segments.map(({ color, p, path, lx, ly }) => (
          <g key={color}>
            <path d={path} fill={COLOR_MAP[color]} stroke="white" strokeWidth="1.2" />
            {p >= 0.12 && (
              <text x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor="middle"
                dominantBaseline="middle" fontSize="9" fill="white" fontWeight="bold">
                {(p * 100).toFixed(0)}%
              </text>
            )}
          </g>
        ))}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="1.5" />
      </svg>
      <div className="flex gap-2 mt-2 flex-wrap justify-center">
        {(Object.entries(probs) as [Color, number][]).map(([color, p]) => (
          <span key={color} className="text-xs font-medium" style={{ color: COLOR_MAP[color] }}>
            {color} {(p * 100).toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RoulettePage() {
  const [results, setResults] = useState<{ 빨강: number; 파랑: number; 초록: number } | null>(null);
  const [answer, setAnswer] = useState<RouletteKey | null>(null);
  const [guess, setGuess] = useState<RouletteKey | ''>('');
  const [revealed, setRevealed] = useState(false);

  function run() {
    const keys = ['A', 'B', 'C'] as RouletteKey[];
    const chosen = keys[Math.floor(rand() * 3)] as RouletteKey;
    const counts = { 빨강: 0, 파랑: 0, 초록: 0 };
    for (let i = 0; i < 100; i++) counts[spinRoulette(chosen)]++;
    setResults(counts);
    setAnswer(chosen);
    setGuess('');
    setRevealed(false);
  }

  const data = results
    ? [
        { name: '빨강', count: results.빨강, fill: '#ef4444' },
        { name: '파랑', count: results.파랑, fill: '#3b82f6' },
        { name: '초록', count: results.초록, fill: '#10b981' },
      ]
    : [];

  return (
    <SimLayout title="09 — 룰렛 맞추기" description="3종 룰렛 중 하나를 무작위로 선택해 100번 돌립니다. 결과를 보고 어떤 룰렛인지 맞춰보세요.">
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(Object.keys(ROULETTES) as RouletteKey[]).map((k) => (
          <RouletteViz key={k} label={k} probs={ROULETTES[k]} />
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <button className={BTN} onClick={run}>룰렛 선택 후 100번 돌리기</button>
        <button className={BTN} onClick={() => { setResults(null); setAnswer(null); setGuess(''); setRevealed(false); }}>다시하기</button>
      </div>

      {results && (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="횟수" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 bg-[#f8f8f6] rounded-xl p-4">
            <p className="text-sm font-semibold mb-3">어느 룰렛이라고 생각하시나요?</p>
            <div className="flex gap-3 mb-4">
              {(['A', 'B', 'C'] as RouletteKey[]).map((k) => (
                <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="guess" value={k} checked={guess === k}
                    onChange={() => setGuess(k)} />
                  <span className="text-sm font-medium">룰렛 {k}</span>
                </label>
              ))}
            </div>
            <button
              className={BTN + ' bg-[#534AB7] text-white border-[#534AB7] hover:bg-[#4239a0]'}
              onClick={() => setRevealed(true)}
              disabled={!guess}
            >
              확인
            </button>

            {revealed && answer && (
              <div className={`mt-4 p-3 rounded-lg ${guess === answer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <p className="font-semibold">정답: 룰렛 {answer}</p>
                <p className="text-sm">{guess === answer ? '정답입니다! 🎉' : `틀렸습니다. 정답은 ${answer}이었습니다.`}</p>
              </div>
            )}
          </div>
        </>
      )}
    </SimLayout>
  );
}
