'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import SimLayout from '@/components/SimLayout';
import { bernoulli } from '@/lib/rng';

const BTN = 'border border-black/15 rounded-lg px-4 py-2 text-sm hover:bg-[#f0f0f0] cursor-pointer';

export default function CoinPage() {
  const [heads, setHeads] = useState(0);
  const [tails, setTails] = useState(0);

  function flip(n: number) {
    let h = 0;
    for (let i = 0; i < n; i++) if (bernoulli(0.5)) h++;
    setHeads((p) => p + h);
    setTails((p) => p + (n - h));
  }

  const total = heads + tails;
  const data = [
    { name: '앞면 (H)', count: heads },
    { name: '뒷면 (T)', count: tails },
  ];

  return (
    <SimLayout title="01 — 동전 (50:50)" description="앞/뒤 각 50% 확률. 던질수록 이론값에 수렴합니다.">
      <div className="flex gap-2 flex-wrap mb-6">
        {[1, 10, 100].map((n) => (
          <button key={n} className={BTN} onClick={() => flip(n)}>{n}번 던지기</button>
        ))}
        <button className={BTN} onClick={() => { setHeads(0); setTails(0); }}>다시하기</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '총 횟수', value: total },
          { label: '앞면', value: `${heads} (${total ? ((heads / total) * 100).toFixed(1) : 0}%)` },
          { label: '뒷면', value: `${tails} (${total ? ((tails / total) * 100).toFixed(1) : 0}%)` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#f8f8f6] rounded-xl p-4">
            <p className="text-xs text-[#666] mb-1">{label}</p>
            <p className="text-xl font-bold text-[#111]">{value}</p>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis dataKey="name" tick={{ fontSize: 13 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <ReferenceLine y={total / 2} stroke="#534AB7" strokeDasharray="4 3" label={{ value: '이론값', fontSize: 11, fill: '#534AB7' }} />
          <Bar dataKey="count" fill="#534AB7" radius={[4, 4, 0, 0]} name="횟수" />
        </BarChart>
      </ResponsiveContainer>
    </SimLayout>
  );
}
