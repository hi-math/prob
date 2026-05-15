'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SimLayout from '@/components/SimLayout';
import { rand } from '@/lib/rng';

const BTN = 'border border-black/15 rounded-lg px-4 py-2 text-sm hover:bg-[#f0f0f0] cursor-pointer';

type Point = { x: number; y: number; inside: boolean };

const MAX_POINTS = 50000;

export default function PiPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);

  const draw = useCallback((pts: Point[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const S = canvas.width;

    ctx.clearRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, S, S);

    ctx.beginPath();
    ctx.arc(0, S, S, -Math.PI / 2, 0);
    ctx.strokeStyle = '#534AB7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const RENDER_MAX = 10000;
    const toRender = pts.length > RENDER_MAX ? pts.slice(-RENDER_MAX) : pts;
    for (const p of toRender) {
      ctx.fillStyle = p.inside ? '#534AB7' : '#ef4444';
      ctx.beginPath();
      ctx.arc(p.x * S, (1 - p.y) * S, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  useEffect(() => { draw(points); }, [points, draw]);

  function addPoints(n: number) {
    setPoints((prev) => {
      const next = [...prev];
      for (let i = 0; i < n && next.length < MAX_POINTS; i++) {
        const x = rand();
        const y = rand();
        next.push({ x, y, inside: x * x + y * y <= 1 });
      }
      return next;
    });
  }

  const inside = points.filter((p) => p.inside).length;
  const piEst = points.length > 0 ? (4 * inside) / points.length : 0;
  const error = Math.abs(piEst - Math.PI);

  return (
    <SimLayout title="10 — 몬테카를로 π" description="정사각형 안 무작위 점 중 원 안에 있는 비율 × 4 ≈ π">
      <div className="flex gap-2 flex-wrap mb-6">
        {[100, 1000, 10000].map((n) => (
          <button key={n} className={BTN} onClick={() => addPoints(n)}>+{n.toLocaleString()}점</button>
        ))}
        <button className={BTN} onClick={() => setPoints([])}>다시하기</button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: '총 점', value: points.length.toLocaleString() },
          { label: '원 안 점', value: inside.toLocaleString() },
          { label: '추정 π', value: piEst.toFixed(5) },
          { label: '오차', value: error.toFixed(5) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#f8f8f6] rounded-xl p-3">
            <p className="text-xs text-[#666] mb-1">{label}</p>
            <p className="text-lg font-bold text-[#534AB7]">{value}</p>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} width={400} height={400}
        className="rounded-xl border border-black/10 bg-white w-full max-w-md" />
      <p className="text-xs text-[#666] mt-2">보라 = 원 안 · 빨강 = 원 밖</p>
    </SimLayout>
  );
}
