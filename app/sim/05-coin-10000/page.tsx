'use client';

import { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import SimLayout from '@/components/SimLayout';

const MAX_K = 25;

const DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
};

function DieFace({ value, got3 }: { value: number | null; got3: boolean }) {
  const dots = value ? DOTS[value] : [];
  return (
    <div className={`w-28 h-28 rounded-2xl border-2 shadow-md transition-colors ${
      got3 ? 'border-emerald-400 bg-emerald-50' : 'border-black/20 bg-white'
    }`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {dots.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={8}
            fill={got3 ? '#10b981' : value === 3 ? '#534AB7' : '#111'} />
        ))}
      </svg>
    </div>
  );
}

export default function Dice3Page() {
  const [dieValue, setDieValue]     = useState<number | null>(null);
  const [count,    setCount]        = useState(0);   // throws in current run
  const [records,  setRecords]      = useState<number[]>([]);
  const [got3,     setGot3]         = useState(false);
  const [showTheory, setShowTheory] = useState(false);

  function throwDie() {
    if (got3) return;
    const val = Math.ceil(Math.random() * 6);
    const next = count + 1;
    setDieValue(val);
    setCount(next);

    if (val === 3) {
      setGot3(true);
      setRecords((prev) => [...prev, next]);
      setTimeout(() => { setGot3(false); setCount(0); setDieValue(null); }, 1000);
    }
  }

  function reset() {
    setDieValue(null); setCount(0); setRecords([]); setGot3(false); setShowTheory(false);
  }

  const n = records.length;
  const avg = n > 0 ? records.reduce((a, b) => a + b, 0) / n : null;

  const countMap: Record<number, number> = {};
  for (const r of records) countMap[r] = (countMap[r] || 0) + 1;

  const data = Array.from({ length: MAX_K }, (_, i) => {
    const k = i + 1;
    return {
      k,
      freq:   n > 0 ? (countMap[k] || 0) / n : 0,
      theory: Math.pow(5 / 6, k - 1) / 6,
    };
  });

  return (
    <SimLayout title="05 — 3이 나올 때까지" description="주사위를 직접 던져 3이 나올 때까지 걸린 횟수를 기록합니다.">

      {/* Top section */}
      <div className="flex gap-8 items-start mb-8">

        {/* Die + button */}
        <div className="flex flex-col items-center gap-4">
          <DieFace value={dieValue} got3={got3} />
          <button
            onClick={throwDie}
            disabled={got3}
            className="px-7 py-3 rounded-xl text-base font-semibold bg-[#111] text-white hover:opacity-85 disabled:opacity-30 transition-opacity"
          >
            던지기
          </button>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className="bg-[#f8f8f6] rounded-xl p-4">
            <p className="text-xs text-[#666] mb-1">이번 실험 던진 횟수</p>
            <p className="text-4xl font-bold text-[#534AB7]">{count}</p>
          </div>

          {got3 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <p className="text-emerald-700 font-semibold text-sm">3 출현! {count}번 만에 성공 → 기록됨</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#f8f8f6] rounded-xl p-3 text-center">
              <p className="text-xs text-[#666] mb-1">실험 수</p>
              <p className="text-xl font-bold">{n}</p>
            </div>
            <div className="bg-[#f8f8f6] rounded-xl p-3 text-center">
              <p className="text-xs text-[#666] mb-1">실험 평균</p>
              <p className="text-xl font-bold">{avg !== null ? avg.toFixed(2) : '–'}</p>
            </div>
            <div className="bg-[#EEEDFE] rounded-xl p-3 text-center">
              <p className="text-xs text-[#534AB7] mb-1">이론 평균</p>
              <p className="text-xl font-bold text-[#534AB7]">6.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-semibold text-[#111]">확률분포</p>
        <div className="flex gap-2">
          <button onClick={() => setShowTheory((v) => !v)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
              showTheory
                ? 'bg-[#f59e0b] text-white border-[#f59e0b]'
                : 'border-black/15 hover:bg-[#f0f0f0]'
            }`}>
            {showTheory ? '이론값 숨기기' : '확인하기'}
          </button>
          <button onClick={reset}
            className="border border-black/15 rounded-lg px-3 py-1.5 text-sm hover:bg-[#f0f0f0]">
            초기화
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
          <XAxis dataKey="k" tick={{ fontSize: 11 }}
            label={{ value: '던진 횟수 k', position: 'insideBottom', offset: -8, fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
          <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(2)}%`} />
          <Bar dataKey="freq" fill="#534AB7" opacity={0.85} name="실험 비율" radius={[2, 2, 0, 0]} />
          {showTheory && (
            <Line type="monotone" dataKey="theory" stroke="#f59e0b" dot={false} strokeWidth={2} name="이론값" />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Recent records */}
      {records.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-[#666] mb-2">최근 기록</p>
          <div className="flex flex-wrap gap-1.5">
            {[...records].reverse().slice(0, 30).map((r, i) => (
              <span key={i}
                className="bg-[#EEEDFE] text-[#534AB7] text-xs font-medium px-2.5 py-1 rounded-lg">
                {r}번
              </span>
            ))}
          </div>
        </div>
      )}
    </SimLayout>
  );
}
