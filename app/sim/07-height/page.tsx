'use client';

import { useState, useMemo } from 'react';
import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import SimLayout from '@/components/SimLayout';
import { normal, bernoulli } from '@/lib/rng';

const MALE   = { mean: 173, std: 5.6 };
const FEMALE = { mean: 162, std: 6.1 };
const X_MIN = 135, X_MAX = 205;
const STEP = 0.5;

function pdf(x: number, mean: number, std: number) {
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / std) ** 2);
}

// Pre-compute chart data
const CHART_DATA = Array.from(
  { length: Math.round((X_MAX - X_MIN) / STEP) + 1 },
  (_, i) => {
    const h = X_MIN + i * STEP;
    return { height: h, male: pdf(h, MALE.mean, MALE.std), female: pdf(h, FEMALE.mean, FEMALE.std) };
  },
);

type Record = { height: number; actualGender: '남' | '여'; pMale: number };

function bayes(h: number, prior: number) {
  const pHM = pdf(h, MALE.mean, MALE.std);
  const pHF = pdf(h, FEMALE.mean, FEMALE.std);
  const pH  = pHM * prior + pHF * (1 - prior);
  return { pMale: (pHM * prior) / pH, pFemale: (pHF * (1 - prior)) / pH };
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium" style={{ color }}>{label}</span>
        <span className="font-bold" style={{ color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-3 bg-black/8 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-150"
          style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export default function HeightPage() {
  const [prior,          setPrior]          = useState(0.5);
  const [selectedHeight, setSelectedHeight] = useState(167);
  const [history,        setHistory]        = useState<Record[]>([]);

  const { pMale, pFemale } = useMemo(
    () => bayes(selectedHeight, prior),
    [selectedHeight, prior],
  );

  function measure() {
    const isMale = bernoulli(prior);
    const h = Math.round((isMale ? normal(MALE.mean, MALE.std) : normal(FEMALE.mean, FEMALE.std)) * 10) / 10;
    const { pMale: pm } = bayes(h, prior);
    const gender: '남' | '여' = isMale ? '남' : '여';
    setHistory((prev) => [{ height: h, actualGender: gender, pMale: pm }, ...prev].slice(0, 10));
    setSelectedHeight(Math.round(h));
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean; payload?: { value: number }[]; label?: number;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-black/10 rounded-lg p-2 text-xs shadow">
        <p className="font-semibold mb-1">{Number(label).toFixed(1)} cm</p>
        <p style={{ color: '#3b82f6' }}>남자: {((payload[0]?.value ?? 0) * 100).toFixed(3)}%/cm</p>
        <p style={{ color: '#ec4899' }}>여자: {((payload[1]?.value ?? 0) * 100).toFixed(3)}%/cm</p>
      </div>
    );
  };

  return (
    <SimLayout title="07 — 남녀 키 분포"
      description="키를 관측했을 때 성별 사후확률을 베이즈 정리로 계산합니다.">

      {/* Prior slider */}
      <div className="bg-[#f5f5f5] rounded-lg p-3 mb-5">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[#666]">남자 사전확률</span>
          <span className="font-semibold text-[#534AB7]">{(prior * 100).toFixed(0)}%</span>
        </div>
        <input type="range" min={0.05} max={0.95} step={0.05} value={prior}
          onChange={(e) => setPrior(+e.target.value)} className="w-full" />
      </div>

      {/* Distribution chart */}
      <div className="mb-1">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={CHART_DATA} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" />
            <XAxis dataKey="height" type="number" domain={[X_MIN, X_MAX]}
              tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`}
              label={{ value: '키 (cm)', position: 'insideBottom', offset: -2, fontSize: 12 }} />
            <YAxis tick={false} width={8} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={24}
              formatter={(v) => v === 'male' ? '남자 (μ=173, σ=5.6)' : '여자 (μ=162, σ=6.1)'} />
            <Area type="monotone" dataKey="male" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15}
              strokeWidth={2} dot={false} name="male" />
            <Area type="monotone" dataKey="female" stroke="#ec4899" fill="#ec4899" fillOpacity={0.15}
              strokeWidth={2} dot={false} name="female" />
            <ReferenceLine x={selectedHeight} stroke="#534AB7" strokeWidth={2}
              label={{ value: `${selectedHeight}cm`, position: 'top', fontSize: 11, fill: '#534AB7' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Height slider */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-[#999] mb-1 px-1">
          <span>{X_MIN}cm</span>
          <span className="font-semibold text-[#534AB7] text-sm">{selectedHeight} cm</span>
          <span>{X_MAX}cm</span>
        </div>
        <input type="range" min={X_MIN} max={X_MAX} step={1} value={selectedHeight}
          onChange={(e) => setSelectedHeight(+e.target.value)} className="w-full" />
      </div>

      {/* Probability display */}
      <div className="bg-[#f8f8f6] rounded-xl p-4 mb-5 space-y-3">
        <p className="text-sm font-semibold text-[#111] mb-2">
          키 {selectedHeight}cm 일 때 성별 확률
        </p>
        <ProbBar label="남자일 확률" value={pMale}   color="#3b82f6" />
        <ProbBar label="여자일 확률" value={pFemale} color="#ec4899" />
      </div>

      {/* Simulate button */}
      <div className="flex gap-2 mb-5">
        <button onClick={measure}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#111] text-white hover:opacity-85">
          랜덤 키 측정하기
        </button>
        <button onClick={() => setHistory([])}
          className="border border-black/15 rounded-lg px-4 py-2 text-sm hover:bg-[#f0f0f0]">
          기록 초기화
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#666] text-xs border-b border-black/10">
              <th className="text-left py-1.5">키</th>
              <th className="text-left py-1.5">실제</th>
              <th className="text-left py-1.5">P(남)</th>
              <th className="text-left py-1.5">P(여)</th>
            </tr>
          </thead>
          <tbody>
            {history.map((r, i) => (
              <tr key={i} className="border-b border-black/5">
                <td className="py-1.5 font-medium">{r.height}cm</td>
                <td className="py-1.5">{r.actualGender}</td>
                <td className="py-1.5" style={{ color: '#3b82f6' }}>{(r.pMale * 100).toFixed(1)}%</td>
                <td className="py-1.5" style={{ color: '#ec4899' }}>{((1 - r.pMale) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SimLayout>
  );
}
