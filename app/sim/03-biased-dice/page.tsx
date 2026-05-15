'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SimLayout from '@/components/SimLayout';
import { choice } from '@/lib/rng';

const BTN = 'border border-black/15 rounded-lg px-4 py-2 text-sm hover:bg-[#f0f0f0] cursor-pointer';
const FACES = [1, 1, 1, 2, 3, 4] as const;
const UNIQUE = [1, 2, 3, 4];

export default function BiasedDicePage() {
  const [counts, setCounts] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });

  function roll(n: number) {
    const next = { ...counts };
    for (let i = 0; i < n; i++) next[choice(FACES as unknown as number[])]++;
    setCounts(next);
  }

  const total = UNIQUE.reduce((s, f) => s + counts[f], 0);
  const data = UNIQUE.map((f) => ({ name: `${f}면`, count: counts[f] }));

  return (
    <SimLayout title="03 — 이상한 주사위">
      <div className="flex gap-2 flex-wrap mb-6">
        {[1, 10, 100].map((n) => (
          <button key={n} className={BTN} onClick={() => roll(n)}>{n}번 굴리기</button>
        ))}
        <button className={BTN} onClick={() => setCounts({ 1: 0, 2: 0, 3: 0, 4: 0 })}>다시하기</button>
      </div>

      <p className="text-sm text-[#666] mb-4">총 {total}번</p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="name" tick={{ fontSize: 13 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#534AB7" radius={[4, 4, 0, 0]} name="횟수" />
        </BarChart>
      </ResponsiveContainer>
    </SimLayout>
  );
}
