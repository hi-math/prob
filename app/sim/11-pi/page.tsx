'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import SimLayout from '@/components/SimLayout';
import { rand } from '@/lib/rng';

type Bridge = { row: number; col: number };
type Step = 'setup' | 'select' | 'simulating' | 'result';

const ROWS = 20;
const CW = 480;
const CH = 400;
const MX = 50;
const MY = 40;

function colX(c: number, n: number): number {
  return MX + c * ((CW - 2 * MX) / (n - 1));
}
function rowY(r: number): number {
  return MY + r * ((CH - 2 * MY) / ROWS);
}

function generateLadder(n: number, rows: number = ROWS): Bridge[] {
  const bridges: Bridge[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < n - 1; c++) {
      const adjacentLeft = bridges.some(b => b.row === r && b.col === c - 1);
      if (!adjacentLeft && rand() < 0.4) {
        bridges.push({ row: r, col: c });
      }
    }
  }
  return bridges;
}

function tracePath(bridges: Bridge[], startCol: number, rows: number = ROWS): number[] {
  const path = [startCol];
  let col = startCol;
  for (let r = 0; r < rows; r++) {
    const right = bridges.find(b => b.row === r && b.col === col);
    const left  = bridges.find(b => b.row === r && b.col === col - 1);
    if (right) col++;
    else if (left) col--;
    path.push(col);
  }
  return path;
}

function makeShuffled(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const BTN = 'border border-black/15 rounded-lg px-4 py-2 text-sm hover:bg-[#f0f0f0] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
const INPUT_CLS = 'border border-black/15 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-[#534AB7]';

export default function LadderPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);

  // Animation refs (read inside RAF without stale closure issues)
  const allSimsRef      = useRef<{ bridges: Bridge[]; path: number[] }[]>([]);
  const animIdxRef      = useRef(0);
  const animPStepRef    = useRef(0); // path step within current sim (0..ROWS)
  const spfRef          = useRef(1); // steps per frame
  const animRunningRef  = useRef(false);
  const ladderCntRef    = useRef(4);
  const destRef         = useRef<number[]>([]);
  const selIdxRef       = useRef<number | null>(null);
  const tallyRef        = useRef<number[]>([]);

  const [step,        setStep]        = useState<Step>('setup');
  const [ladderCount, setLadderCount] = useState(4);
  const [simCount,    setSimCount]    = useState(100);
  const [lcError,     setLcError]     = useState('');
  const [scError,     setScError]     = useState('');

  const [fixedBridges, setFixedBridges] = useState<Bridge[]>([]);
  const [destinations, setDestinations] = useState<number[]>([]);
  const [selectedIdx,  setSelectedIdx]  = useState<number | null>(null);

  const [tally,       setTally]       = useState<number[]>([]);
  const [lastBridges, setLastBridges] = useState<Bridge[]>([]);
  const [lastPath,    setLastPath]    = useState<number[]>([]);
  const [animProg,    setAnimProg]    = useState({ cur: 0, total: 0 });

  // ── Canvas drawing ───────────────────────────────────────────────────────
  const drawLadder = useCallback((
    bridges: Bridge[], n: number, dests: number[],
    selected: number | null,
    path: number[] | null,
    pStep?: number, // if defined: animate; draw path up to this step + moving dot
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || n < 2) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CW, CH);
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, CW, CH);

    // Columns
    for (let c = 0; c < n; c++) {
      ctx.beginPath();
      ctx.moveTo(colX(c, n), rowY(0));
      ctx.lineTo(colX(c, n), rowY(ROWS));
      ctx.strokeStyle = selected === c ? '#534AB7' : '#ccc';
      ctx.lineWidth   = selected === c ? 3 : 2;
      ctx.stroke();
    }

    // Bridges
    for (const b of bridges) {
      ctx.beginPath();
      ctx.moveTo(colX(b.col,     n), rowY(b.row + 0.5));
      ctx.lineTo(colX(b.col + 1, n), rowY(b.row + 0.5));
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth   = 2;
      ctx.stroke();
    }

    // Path segments
    if (path) {
      const limit = pStep !== undefined ? pStep : path.length - 1;
      ctx.strokeStyle = '#E24B4A';
      ctx.lineWidth   = 3;
      for (let r = 0; r < Math.min(limit, path.length - 1); r++) {
        const fc = path[r], tc = path[r + 1];
        const y1 = rowY(r), y2 = rowY(r + 1), ym = rowY(r + 0.5);
        if (fc === tc) {
          ctx.beginPath(); ctx.moveTo(colX(fc, n), y1); ctx.lineTo(colX(tc, n), y2); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(colX(fc, n), y1);  ctx.lineTo(colX(fc, n), ym); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(colX(fc, n), ym);  ctx.lineTo(colX(tc, n), ym); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(colX(tc, n), ym);  ctx.lineTo(colX(tc, n), y2); ctx.stroke();
        }
      }

      if (pStep !== undefined) {
        // Moving dot (current position during animation)
        const curCol = path[Math.min(pStep, ROWS)];
        ctx.beginPath();
        ctx.arc(colX(curCol, n), rowY(Math.min(pStep, ROWS)), 7, 0, Math.PI * 2);
        ctx.fillStyle   = '#E24B4A';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth   = 2;
        ctx.stroke();
      } else {
        // Arrival dot (result view)
        const dc = path[path.length - 1];
        ctx.beginPath();
        ctx.arc(colX(dc, n), rowY(ROWS), 10, 0, Math.PI * 2);
        ctx.fillStyle = '#E24B4A';
        ctx.fill();
      }
    }

    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // ▼ indicator
    if (selected !== null) {
      ctx.fillStyle = '#534AB7';
      ctx.font      = '14px sans-serif';
      ctx.fillText('▼', colX(selected, n), rowY(0) - 36);
      ctx.font      = 'bold 13px sans-serif';
    }

    // Top circles
    for (let c = 0; c < n; c++) {
      ctx.beginPath();
      ctx.arc(colX(c, n), rowY(0) - 18, 13, 0, Math.PI * 2);
      ctx.fillStyle   = selected === c ? '#534AB7' : '#EEEDFE';
      ctx.fill();
      ctx.strokeStyle = '#534AB7'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle   = selected === c ? 'white' : '#534AB7';
      ctx.fillText(String(c + 1), colX(c, n), rowY(0) - 18);
    }

    // Bottom circles
    const finalCol = path && pStep === undefined ? path[path.length - 1] : null;
    for (let c = 0; c < n; c++) {
      const isArrival = finalCol === c;
      ctx.beginPath();
      ctx.arc(colX(c, n), rowY(ROWS) + 18, 13, 0, Math.PI * 2);
      ctx.fillStyle   = isArrival ? '#E24B4A' : '#f8f8f6';
      ctx.fill();
      ctx.strokeStyle = isArrival ? '#E24B4A' : '#ccc';
      ctx.lineWidth   = isArrival ? 2 : 1.5; ctx.stroke();
      ctx.fillStyle   = isArrival ? 'white' : '#666';
      const label = dests.length > c ? dests[c] + 1 : c + 1;
      ctx.fillText(String(label), colX(c, n), rowY(ROWS) + 18);
    }
  }, []);

  useEffect(() => {
    if (step === 'select') {
      drawLadder(fixedBridges, ladderCount, destinations, selectedIdx, null);
    } else if (step === 'result') {
      drawLadder(lastBridges, ladderCount, destinations, selectedIdx, lastPath);
    }
  }, [step, fixedBridges, ladderCount, destinations, selectedIdx, lastBridges, lastPath, drawLadder]);

  // ── Animation loop (latest-ref pattern) ─────────────────────────────────
  const animFnRef = useRef<() => void>(() => {});
  animFnRef.current = () => {
    if (!animRunningRef.current) return;

    const sims  = allSimsRef.current;
    const n     = ladderCntRef.current;
    const dests = destRef.current;
    const sel   = selIdxRef.current;
    const prevIdx = animIdxRef.current;

    let pStep = animPStepRef.current;
    let idx   = animIdxRef.current;

    for (let i = 0; i < spfRef.current; i++) {
      pStep++;
      if (pStep > ROWS) {
        pStep = 0;
        idx++;
        if (idx >= sims.length) {
          // All simulations done → transition to result
          animRunningRef.current = false;
          const last = sims[sims.length - 1];
          setLastBridges(last.bridges);
          setLastPath(last.path);
          setTally([...tallyRef.current]);
          setAnimProg({ cur: sims.length, total: sims.length });
          setStep('result');
          return;
        }
      }
    }

    animPStepRef.current = pStep;
    animIdxRef.current   = idx;

    // Draw current sim
    const { bridges, path } = sims[idx];
    drawLadder(bridges, n, dests, sel, path, pStep);

    // Update progress counter only when sim index changes
    if (idx !== prevIdx) {
      setAnimProg({ cur: idx + 1, total: sims.length });
    }

    rafRef.current = requestAnimationFrame(() => animFnRef.current());
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  function validate(): boolean {
    let ok = true;
    if (!Number.isInteger(ladderCount) || ladderCount < 2 || ladderCount > 8) {
      setLcError('2~8 사이의 정수를 입력하세요'); ok = false;
    } else setLcError('');
    if (!Number.isInteger(simCount) || simCount < 10 || simCount > 10000) {
      setScError('10~10000 사이의 정수를 입력하세요'); ok = false;
    } else setScError('');
    return ok;
  }

  function startGame() {
    if (!validate()) return;
    setFixedBridges(generateLadder(ladderCount));
    setDestinations(makeShuffled(ladderCount));
    setSelectedIdx(null);
    setStep('select');
  }

  function confirmSelection() {
    if (selectedIdx === null) return;

    // Pre-compute all simulations
    const dests = destinations;
    const sims = Array.from({ length: simCount }, () => {
      const bridges = generateLadder(ladderCount);
      const path    = tracePath(bridges, selectedIdx);
      return { bridges, path };
    });

    // Compute tally upfront
    const counts = Array<number>(ladderCount).fill(0);
    for (const { path } of sims) counts[dests[path[path.length - 1]]]++;
    tallyRef.current = counts;

    // Set animation refs
    allSimsRef.current   = sims;
    animIdxRef.current   = 0;
    animPStepRef.current = 0;
    ladderCntRef.current = ladderCount;
    destRef.current      = dests;
    selIdxRef.current    = selectedIdx;
    // Target ~6 seconds (360 frames at 60fps)
    spfRef.current = Math.max(1, Math.ceil((simCount * ROWS) / 360));
    animRunningRef.current = true;

    setAnimProg({ cur: 1, total: simCount });
    setStep('simulating');
    rafRef.current = requestAnimationFrame(() => animFnRef.current());
  }

  function skipAnimation() {
    animRunningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    const sims = allSimsRef.current;
    const last = sims[sims.length - 1];
    setLastBridges(last.bridges);
    setLastPath(last.path);
    setTally([...tallyRef.current]);
    setStep('result');
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (step !== 'select') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect  = canvas.getBoundingClientRect();
    const cx    = (e.clientX - rect.left) * (CW / rect.width);
    let closest = 0, minD = Infinity;
    for (let c = 0; c < ladderCount; c++) {
      const d = Math.abs(cx - colX(c, ladderCount));
      if (d < minD) { minD = d; closest = c; }
    }
    if (minD < 60) setSelectedIdx(closest);
  }

  useEffect(() => () => { animRunningRef.current = false; cancelAnimationFrame(rafRef.current); }, []);

  // ── Chart data ───────────────────────────────────────────────────────────
  const maxCount      = tally.length ? Math.max(...tally) : 0;
  const topIdx        = tally.length ? tally.indexOf(maxCount) : 0;
  const chartData     = Array.from({ length: ladderCount }, (_, i) => ({
    name:  `${i + 1}번`,
    count: tally[i] ?? 0,
    isMax: tally.length > 0 && (tally[i] ?? 0) === maxCount && maxCount > 0,
  }));
  const theoreticalAvg = simCount / ladderCount;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SimLayout title="11 — 사다리타기" description="사다리를 선택하고 결과가 얼마나 고른지 확인해보세요.">

      {/* STEP 1: 설정 */}
      {step === 'setup' && (
        <div className="max-w-sm">
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm text-[#666] block mb-1">사다리 수 (2~8)</label>
              <input type="number" min={2} max={8} value={ladderCount}
                onChange={e => setLadderCount(+e.target.value)} className={INPUT_CLS} />
              {lcError && <p className="text-xs text-[#E24B4A] mt-1">{lcError}</p>}
            </div>
            <div>
              <label className="text-sm text-[#666] block mb-1">시뮬레이션 횟수 (10~10000)</label>
              <input type="number" min={10} max={10000} value={simCount}
                onChange={e => setSimCount(+e.target.value)} className={INPUT_CLS} />
              {scError && <p className="text-xs text-[#E24B4A] mt-1">{scError}</p>}
            </div>
          </div>
          <button
            className="bg-[#534AB7] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#4239a0] cursor-pointer"
            onClick={startGame}
          >
            시작하기
          </button>
        </div>
      )}

      {/* STEP 2: 사다리 선택 */}
      {step === 'select' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-[#666]">어느 사다리를 선택하시겠어요? 상단 번호를 클릭하세요.</p>
            <button className="text-sm text-[#534AB7] hover:underline" onClick={() => setStep('setup')}>← 설정으로</button>
          </div>
          <canvas ref={canvasRef} width={CW} height={CH}
            className="rounded-xl border border-black/10 bg-[#fafaf8] w-full cursor-pointer"
            onClick={handleCanvasClick} />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-[#666]">
              선택된 사다리:{' '}
              <strong className="text-[#534AB7]">
                {selectedIdx !== null ? `${selectedIdx + 1}번` : '없음'}
              </strong>
            </p>
            <button
              className="bg-[#534AB7] text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-[#4239a0] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={confirmSelection} disabled={selectedIdx === null}
            >
              선택 확정
            </button>
          </div>
        </div>
      )}

      {/* STEP 2.5: 시뮬레이션 중 */}
      {step === 'simulating' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#534AB7]">
              시뮬레이션 중... {animProg.cur} / {animProg.total}회
            </p>
            <button
              className="text-sm text-[#534AB7] hover:underline cursor-pointer"
              onClick={skipAnimation}
            >
              건너뛰기 →
            </button>
          </div>
          <canvas ref={canvasRef} width={CW} height={CH}
            className="rounded-xl border border-black/10 bg-[#fafaf8] w-full" />
          <div className="mt-3 bg-[#eee] rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#534AB7]"
              style={{ width: `${(animProg.cur / animProg.total) * 100}%`, transition: 'width 0.1s linear' }}
            />
          </div>
        </div>
      )}

      {/* STEP 3: 결과 */}
      {step === 'result' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-[#666]">
              <strong className="text-[#111]">{selectedIdx !== null ? `${selectedIdx + 1}번` : '?'}</strong> 사다리 ·{' '}
              {simCount.toLocaleString()}회 시뮬레이션
            </p>
            <button className="text-sm text-[#534AB7] hover:underline" onClick={() => setStep('select')}>← 선택으로</button>
          </div>

          <div className="flex gap-6 flex-wrap items-start mb-6">
            <canvas ref={canvasRef} width={CW} height={CH}
              className="rounded-xl border border-black/10 bg-[#fafaf8] shrink-0"
              style={{ maxWidth: CW }} />

            <div className="flex-1 min-w-[180px] space-y-4">
              <div className="bg-[#EEEDFE] rounded-xl p-4">
                <p className="text-xs text-[#666] mb-1">가장 많이 나온 곳</p>
                <p className="text-xl font-bold text-[#534AB7]">{topIdx + 1}번 ({maxCount}회)</p>
              </div>
              <div className="space-y-2">
                {chartData.map(({ name, count }) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-xs w-8 text-[#666]">{name}</span>
                    <div className="flex-1 bg-[#eee] rounded h-4 overflow-hidden">
                      <div className="h-full rounded"
                        style={{ width: `${simCount > 0 ? (count / simCount) * 100 : 0}%`, background: '#534AB7' }} />
                    </div>
                    <span className="text-xs text-[#666] w-10 text-right">
                      {simCount > 0 ? Math.round((count / simCount) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-[#666] mb-2">도착지별 횟수</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <ReferenceLine y={theoreticalAvg} stroke="#aaa" strokeDasharray="5 3"
                  label={{ value: `이론값 ${theoreticalAvg.toFixed(1)}`, fill: '#999', fontSize: 11, position: 'right' }} />
                <Bar dataKey="count" name="횟수" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.isMax ? '#534AB7' : '#EEEDFE'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-2">
            <button className={BTN} onClick={() => setStep('setup')}>설정으로</button>
            <button className={BTN} onClick={() => {
              setFixedBridges(generateLadder(ladderCount));
              setDestinations(makeShuffled(ladderCount));
              setSelectedIdx(null);
              setStep('select');
            }}>다시하기</button>
          </div>
        </div>
      )}
    </SimLayout>
  );
}
