'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SimLayout from '@/components/SimLayout';
import { rand } from '@/lib/rng';

const BTN = 'border border-black/15 rounded-lg px-4 py-2 text-sm hover:bg-[#f0f0f0] cursor-pointer';

const DENSITY_MAP = { 낮음: 0.3, 중간: 0.5, 높음: 0.7 };
type Density = keyof typeof DENSITY_MAP;

type Bridge = { row: number; col: number };

function buildLadder(players: number, rows: number, density: number): Bridge[] {
  const bridges: Bridge[] = [];
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < players - 1) {
      if (rand() < density) {
        if (!bridges.find((b) => b.row === r && b.col === c - 1)) {
          bridges.push({ row: r, col: c });
          c += 2;
        } else { c++; }
      } else { c++; }
    }
  }
  return bridges;
}

function tracePath(start: number, players: number, rows: number, bridges: Bridge[]): number[] {
  const path: number[] = [start];
  let col = start;
  for (let r = 0; r < rows; r++) {
    const left  = bridges.find((b) => b.row === r && b.col === col - 1);
    const right = bridges.find((b) => b.row === r && b.col === col);
    if (right) col++;
    else if (left) col--;
    path.push(col);
  }
  return path;
}

export default function LadderPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [players, setPlayers] = useState(4);
  const [density, setDensity] = useState<Density>('중간');
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [results, setResults] = useState<number[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [highlightPath, setHighlightPath] = useState<number[] | null>(null);
  const ROWS = 10;

  const drawLadder = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    const marginX = 40, marginY = 30;
    const innerW = W - marginX * 2, innerH = H - marginY * 2;
    const colW = innerW / (players - 1), rowH = innerH / ROWS;

    ctx.clearRect(0, 0, W, H);
    function colX(c: number) { return marginX + c * colW; }
    function rowY(r: number) { return marginY + r * rowH; }

    for (let c = 0; c < players; c++) {
      ctx.beginPath(); ctx.moveTo(colX(c), rowY(0)); ctx.lineTo(colX(c), rowY(ROWS));
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2; ctx.stroke();
    }
    for (const b of bridges) {
      ctx.beginPath(); ctx.moveTo(colX(b.col), rowY(b.row + 0.5)); ctx.lineTo(colX(b.col + 1), rowY(b.row + 0.5));
      ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.stroke();
    }
    if (highlightPath && selectedPlayer !== null) {
      for (let r = 0; r <= ROWS; r++) {
        const col = highlightPath[r], col2 = r < ROWS ? highlightPath[r + 1] : null;
        ctx.beginPath(); ctx.arc(colX(col), rowY(r), 5, 0, Math.PI * 2);
        ctx.fillStyle = '#534AB7'; ctx.fill();
        if (col2 !== null && col2 !== col) {
          const halfRow = rowY(r + 0.5);
          ctx.beginPath(); ctx.moveTo(colX(col), rowY(r)); ctx.lineTo(colX(col), halfRow);
          ctx.lineTo(colX(col2), halfRow); ctx.lineTo(colX(col2), rowY(r + 1));
          ctx.strokeStyle = '#534AB7'; ctx.lineWidth = 3; ctx.stroke();
        } else if (col2 !== null) {
          ctx.beginPath(); ctx.moveTo(colX(col), rowY(r)); ctx.lineTo(colX(col), rowY(r + 1));
          ctx.strokeStyle = '#534AB7'; ctx.lineWidth = 3; ctx.stroke();
        }
      }
    }
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    for (let c = 0; c < players; c++) {
      ctx.fillStyle = selectedPlayer === c ? '#534AB7' : '#111';
      ctx.fillText(String(c + 1), colX(c), marginY - 10);
    }
    for (let c = 0; c < players; c++) {
      ctx.fillStyle = '#111';
      ctx.fillText(String(results[c] !== undefined ? results[c] + 1 : ''), colX(c), rowY(ROWS) + 18);
    }
  }, [players, bridges, highlightPath, selectedPlayer, results, ROWS]);

  useEffect(() => { drawLadder(); }, [drawLadder]);

  function generate() {
    setBridges(buildLadder(players, ROWS, DENSITY_MAP[density]));
    setResults([]); setSelectedPlayer(null); setHighlightPath(null);
  }

  function selectPlayer(p: number) {
    setSelectedPlayer(p);
    const path = tracePath(p, players, ROWS, bridges);
    setHighlightPath(path);
    setResults((prev) => { const next = [...prev]; next[p] = path[path.length - 1]; return next; });
  }

  function showAll() {
    setResults(Array.from({ length: players }, (_, i) => tracePath(i, players, ROWS, bridges)[ROWS]));
    setHighlightPath(null); setSelectedPlayer(null);
  }

  return (
    <SimLayout title="11 — 사다리타기" description="랜덤 다리 생성 후 참가자를 클릭하면 경로를 추적합니다.">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm text-[#666] block mb-1">참가자 수: {players}</label>
          <input type="range" min={2} max={8} value={players}
            onChange={(e) => { setPlayers(+e.target.value); setBridges([]); setResults([]); setHighlightPath(null); }}
            className="w-full" />
        </div>
        <div>
          <label className="text-sm text-[#666] block mb-1">다리 밀도: {density}</label>
          <div className="flex gap-2">
            {(['낮음', '중간', '높음'] as Density[]).map((d) => (
              <button key={d} onClick={() => setDensity(d)}
                className={`px-3 py-1 rounded text-sm border ${density === d ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'border-black/15 hover:bg-[#f0f0f0]'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <button className={BTN} onClick={generate}>사다리 생성</button>
        {bridges.length > 0 && <button className={BTN} onClick={showAll}>전체 결과 보기</button>}
      </div>
      {bridges.length > 0 && (
        <>
          <div className="flex gap-2 mb-2 flex-wrap">
            {Array.from({ length: players }, (_, i) => (
              <button key={i} onClick={() => selectPlayer(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  selectedPlayer === i ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'border-black/15 hover:bg-[#f0f0f0]'
                }`}>
                {i + 1}번
              </button>
            ))}
          </div>
          <canvas ref={canvasRef} width={560} height={340}
            className="w-full rounded-xl border border-black/10 bg-[#f8f8f6]" />
        </>
      )}
    </SimLayout>
  );
}
