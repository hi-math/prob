'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import SimLayout from '@/components/SimLayout';
import { randInt } from '@/lib/rng';

const BTN = 'border border-black/15 rounded-lg px-4 py-2 text-sm hover:bg-[#f0f0f0] cursor-pointer';
const FACES = [1, 2, 3, 4, 5, 6];

export default function DicePage() {
  const [counts, setCounts] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });

  function roll(n: number) {
    const next = { ...counts };
    for (let i = 0; i < n; i++) next[randInt(1, 6)]++;
    setCounts(next);
  }

  const total = FACES.reduce((s, f) => s + counts[f], 0);
  const data = FACES.map((f) => ({ name: String(f), count: counts[f] }));
  const theory = total / 6;

  return (
    <SimLayout title="02 — 6면 주사위" description="1~6이 동일한 확률(1/6)로 나옵니다. 이론값을 점선으로 표시합니다.">
      <div className="flex gap-2 flex-wrap mb-6">
        {[1, 10, 100].map((n) => (
          <button key={n} className={BTN} onClick={() => roll(n)}>{n}번 굴리기</button>
        ))}
        <button className={BTN} onClick={() => setCounts({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 })}>다시하기</button>
      </div>

      <p className="text-sm text-[#666] mb-4">총 {total}번 · 이론값(1/6) = {total ? (total / 6).toFixed(1) : 0}회</p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="name" tick={{ fontSize: 13 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          {total > 0 && (
            <ReferenceLine y={theory} stroke="#f59e0b" strokeDasharray="4 3"
              label={{ value: '이론값', fontSize: 11, fill: '#f59e0b', position: 'right' }} />
          )}
          <Bar dataKey="count" fill="#534AB7" radius={[4, 4, 0, 0]} name="횟수" />
        </BarChart>
      </ResponsiveContainer>
    </SimLayout>
  );
}
