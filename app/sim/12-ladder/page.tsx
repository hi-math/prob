'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SimLayout from '@/components/SimLayout';
import { rand } from '@/lib/rng';

const BTN = 'border border-black/15 rounded-lg px-4 py-2 text-sm hover:bg-[#f0f0f0] cursor-pointer';

type Node = { x: number; y: number };

function distance(a: Node, b: Node) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
function totalDist(tour: number[], nodes: Node[]) {
  let d = 0;
  for (let i = 0; i < tour.length; i++)
    d += distance(nodes[tour[i]], nodes[tour[(i + 1) % tour.length]]);
  return d;
}

function acoStep(nodes: Node[], pheromone: number[][], ants: number, evaporation: number, alpha: number, beta: number) {
  const n = nodes.length;
  const tours: number[][] = [];
  for (let a = 0; a < ants; a++) {
    const visited = new Array(n).fill(false);
    const start = Math.floor(rand() * n);
    const tour = [start];
    visited[start] = true;
    while (tour.length < n) {
      const cur = tour[tour.length - 1];
      const probs: number[] = [];
      let total = 0;
      for (let j = 0; j < n; j++) {
        if (!visited[j]) {
          const d = distance(nodes[cur], nodes[j]);
          const p = Math.pow(pheromone[cur][j], alpha) * Math.pow(1 / d, beta);
          probs.push(p); total += p;
        } else { probs.push(0); }
      }
      let r = rand() * total, next = -1;
      for (let j = 0; j < n; j++) { r -= probs[j]; if (r <= 0) { next = j; break; } }
      if (next === -1) next = probs.findIndex((p) => p > 0);
      tour.push(next); visited[next] = true;
    }
    tours.push(tour);
  }
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      pheromone[i][j] *= (1 - evaporation);
  for (const tour of tours) {
    const d = totalDist(tour, nodes), deposit = 1 / d;
    for (let i = 0; i < tour.length; i++) {
      const a = tour[i], b = tour[(i + 1) % tour.length];
      pheromone[a][b] += deposit; pheromone[b][a] += deposit;
    }
  }
  let bestTour = tours[0], bestDist = totalDist(tours[0], nodes);
  for (const t of tours) { const d = totalDist(t, nodes); if (d < bestDist) { bestDist = d; bestTour = t; } }
  return { bestTour, bestDist };
}

export default function AntPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodeCount, setNodeCount] = useState(7);
  const [antCount, setAntCount] = useState(20);
  const [evapRate, setEvapRate] = useState(0.1);
  const [iterations, setIterations] = useState(50);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [bestTour, setBestTour] = useState<number[]>([]);
  const [bestDist, setBestDist] = useState(0);
  const [running, setRunning] = useState(false);
  const [iter, setIter] = useState(0);

  function generateNodes(count: number) {
    setNodes(Array.from({ length: count }, () => ({ x: 40 + rand() * 520, y: 40 + rand() * 260 })));
    setBestTour([]); setBestDist(0); setIter(0);
  }
  useEffect(() => { generateNodes(nodeCount); }, [nodeCount]);

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bestTour.length > 0) {
      ctx.beginPath(); ctx.moveTo(nodes[bestTour[0]].x, nodes[bestTour[0]].y);
      for (let i = 1; i < bestTour.length; i++) ctx.lineTo(nodes[bestTour[i]].x, nodes[bestTour[i]].y);
      ctx.closePath(); ctx.strokeStyle = '#534AB7'; ctx.lineWidth = 2; ctx.stroke();
    }
    nodes.forEach((n, i) => {
      ctx.beginPath(); ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#EEEDFE'; ctx.fill(); ctx.strokeStyle = '#534AB7'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#534AB7'; ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), n.x, n.y);
    });
  }, [nodes, bestTour]);
  useEffect(() => { drawGraph(); }, [drawGraph]);

  async function runACO() {
    if (nodes.length === 0) return;
    setRunning(true);
    const n = nodes.length;
    const pheromone = Array.from({ length: n }, () => new Array(n).fill(1));
    let globalBest: number[] = [], globalBestDist = Infinity;
    for (let i = 0; i < iterations; i++) {
      const { bestTour: t, bestDist: d } = acoStep(nodes, pheromone, antCount, evapRate, 1, 2);
      if (d < globalBestDist) { globalBestDist = d; globalBest = [...t]; }
      setBestTour([...globalBest]); setBestDist(globalBestDist); setIter(i + 1);
      await new Promise((r) => setTimeout(r, 20));
    }
    setRunning(false);
  }

  return (
    <SimLayout title="12 — 개미 최단경로 (ACO)" description="페로몬 기반 개미 군집 최적화(ACO)로 외판원 문제를 풉니다.">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {[
          { label: `노드 수: ${nodeCount}`, min: 5, max: 12, val: nodeCount, set: setNodeCount },
          { label: `개미 수: ${antCount}`, min: 5, max: 50, val: antCount, set: setAntCount },
          { label: `페로몬 증발률: ${evapRate.toFixed(2)}`, min: 0.01, max: 0.5, step: 0.01, val: evapRate, set: setEvapRate },
          { label: `반복 횟수: ${iterations}`, min: 10, max: 200, step: 10, val: iterations, set: setIterations },
        ].map(({ label, min, max, step, val, set }) => (
          <div key={label}>
            <label className="text-sm text-[#666] block mb-1">{label}</label>
            <input type="range" min={min} max={max} step={step ?? 1} value={val}
              onChange={(e) => set(+e.target.value as never)} className="w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <button className={BTN} onClick={runACO} disabled={running}>
          {running ? `${iter}/${iterations} 반복 중...` : '시작'}
        </button>
        <button className={BTN} onClick={() => generateNodes(nodeCount)} disabled={running}>노드 재배치</button>
      </div>
      {bestDist > 0 && (
        <div className="bg-[#EEEDFE] rounded-xl p-3 mb-4 flex items-center gap-4">
          <div><p className="text-xs text-[#666]">현재 최단 거리</p><p className="text-2xl font-bold text-[#534AB7]">{bestDist.toFixed(1)}</p></div>
          <div><p className="text-xs text-[#666]">경로</p><p className="text-sm font-medium">{bestTour.map((n) => n + 1).join(' → ')} → {bestTour[0] + 1}</p></div>
        </div>
      )}
      <canvas ref={canvasRef} width={600} height={340} className="w-full rounded-xl border border-black/10 bg-[#f8f8f6]" />
    </SimLayout>
  );
}
