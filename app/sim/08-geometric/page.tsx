'use client';

import { useState, useMemo } from 'react';
import SimLayout from '@/components/SimLayout';

const N = 10000;

function calcTheory(prior: number, acc: number) {
  const TP = Math.round(N * prior * acc);
  const FN = Math.round(N * prior * (1 - acc));
  const FP = Math.round(N * (1 - prior) * (1 - acc));
  const TN = Math.round(N * (1 - prior) * acc);
  const ppv = TP / (TP + FP);
  const fnr = FN / (FN + TN);
  return { TP, FN, FP, TN, ppv, fnr };
}

type LastTest = 'pos' | 'neg' | null;

export default function DiabetesPage() {
  const [prior, setPrior]         = useState(0.01);
  const [acc,   setAcc]           = useState(0.95);
  const [currentProb, setCurrentProb] = useState(0.01);
  const [lastTest, setLastTest]   = useState<LastTest>(null);
  const [count, setCount]         = useState(0);

  const { TP, FN, FP, TN } = useMemo(() => calcTheory(currentProb, acc), [currentProb, acc]);

  // 순차 베이즈 업데이트: 현재 확률을 새 prior로 사용
  function bayesUpdate(p: number, testPos: boolean): number {
    if (testPos) {
      return (p * acc) / (p * acc + (1 - p) * (1 - acc));
    } else {
      return (p * (1 - acc)) / (p * (1 - acc) + (1 - p) * acc);
    }
  }

  const probLabel =
    lastTest === null  ? '진단 전 암일 확률' :
    lastTest === 'pos' ? '양성 판정 후 암일 확률' :
                         '음성 판정 후 암일 확률';

  function diagnose(testPos: boolean) {
    setCurrentProb(p => bayesUpdate(p, testPos));
    setLastTest(testPos ? 'pos' : 'neg');
    setCount(v => v + 1);
  }

  function reset() {
    setCurrentProb(prior);
    setLastTest(null);
    setCount(0);
  }

  const CELL   = 'border border-black/15 rounded-lg p-3 text-center';
  const HEADER = 'bg-[#f0f0f0] text-xs font-semibold text-[#555]';

  return (
    <SimLayout title="08 — 조건부확률 (암 진단)"
      description="슬라이더로 조건을 설정하고, 직접 진단을 입력하세요.">

      {/* Sliders */}
      <div className="space-y-3 mb-6">
        <div className="bg-[#f5f5f5] rounded-lg px-4 py-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#666]">암 유병률 (사전확률)</span>
            <span className="font-semibold text-[#534AB7]">{(prior * 100).toFixed(1)}%</span>
          </div>
          <input type="range" min={0.001} max={0.5} step={0.001} value={prior}
            onChange={e => { const v = +e.target.value; setPrior(v); setCurrentProb(v); setLastTest(null); setCount(0); }} className="w-full" />
        </div>
        <div className="bg-[#f5f5f5] rounded-lg px-4 py-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#666]">진단 성공률</span>
            <span className="font-semibold text-[#534AB7]">{(acc * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min={0.5} max={0.99} step={0.01} value={acc}
            onChange={e => { setAcc(+e.target.value); setCurrentProb(prior); setLastTest(null); setCount(0); }} className="w-full" />
        </div>
      </div>

      {/* Confusion matrix — theoretical, changes with sliders */}
      <div className="grid grid-cols-3 gap-1.5 mb-5 text-sm">
        <div className={`${CELL} ${HEADER}`}>10,000명 기준</div>
        <div className={`${CELL} ${HEADER}`}>진단: 양성</div>
        <div className={`${CELL} ${HEADER}`}>진단: 음성</div>

        <div className={`${CELL} ${HEADER}`}>실제: 암</div>
        <div className={`${CELL} bg-green-50`}>
          <p className="text-xs text-green-700 font-semibold">TP</p>
          <p className="text-xl font-bold text-green-700">{TP.toLocaleString()}</p>
        </div>
        <div className={`${CELL} bg-red-50`}>
          <p className="text-xs text-red-500 font-semibold">FN</p>
          <p className="text-xl font-bold text-red-500">{FN.toLocaleString()}</p>
        </div>

        <div className={`${CELL} ${HEADER}`}>실제: 정상</div>
        <div className={`${CELL} bg-red-50`}>
          <p className="text-xs text-red-500 font-semibold">FP</p>
          <p className="text-xl font-bold text-red-500">{FP.toLocaleString()}</p>
        </div>
        <div className={`${CELL} bg-green-50`}>
          <p className="text-xs text-green-700 font-semibold">TN</p>
          <p className="text-xl font-bold text-green-700">{TN.toLocaleString()}</p>
        </div>
      </div>

      {/* 암일 확률 */}
      <div className={`rounded-lg p-4 mb-6 border-2 transition-colors ${
        lastTest === null  ? 'bg-[#EEEDFE] border-[#534AB7]/30' :
        lastTest === 'pos' ? 'bg-red-50 border-red-300' :
                             'bg-green-50 border-green-300'
      }`}>
        <p className={`text-xs font-medium mb-1 ${
          lastTest === null  ? 'text-[#534AB7]' :
          lastTest === 'pos' ? 'text-red-600'   : 'text-green-700'
        }`}>{probLabel}</p>
        <p className={`text-3xl font-bold ${
          lastTest === null  ? 'text-[#534AB7]' :
          lastTest === 'pos' ? 'text-red-600'   : 'text-green-700'
        }`}>{(currentProb * 100).toFixed(2)}%</p>
        <p className="text-xs text-[#999] mt-1">
          {lastTest === null  && '사전확률 (유병률)'}
          {lastTest === 'pos' && `${count}번째 양성 판정 후`}
          {lastTest === 'neg' && `${count}번째 음성 판정 후`}
        </p>
      </div>

      {/* Buttons */}
      <div className="border-t border-black/10 pt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#111]">
            {count > 0
              ? <><span className="text-[#534AB7]">{count + 1}번째</span> 진단 입력</>
              : '진단 결과를 직접 입력하세요'}
          </p>
          {count > 0 && (
            <button onClick={reset}
              className="border border-black/15 rounded-lg px-3 py-1.5 text-sm hover:bg-[#f0f0f0]">
              초기화
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => diagnose(true)}
            className="flex-1 py-4 rounded-xl text-base font-bold bg-red-500 hover:bg-red-600 text-white transition-colors">
            암 양성 판정
          </button>
          <button onClick={() => diagnose(false)}
            className="flex-1 py-4 rounded-xl text-base font-bold bg-slate-600 hover:bg-slate-700 text-white transition-colors">
            암 음성 판정
          </button>
        </div>
      </div>
    </SimLayout>
  );
}
