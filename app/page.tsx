import Link from 'next/link';

const SIMS = [
  { num: '01', href: '/sim/01-coin',        title: '동전 (50:50)',      desc: '앞/뒤 각 50% 확률 시뮬레이션' },
  { num: '02', href: '/sim/02-dice',        title: '6면 주사위',        desc: '균등 분포 주사위' },
  { num: '03', href: '/sim/03-biased-dice', title: '이상한 주사위',     desc: '5·6면을 1로 대체한 주사위' },
  { num: '04', href: '/sim/04-bent-coin',   title: '이상한 동전',       desc: '앞면 확률 0.64' },
  { num: '05', href: '/sim/05-coin-10000',  title: '3이 나올 때까지',   desc: '직접 주사위를 던져 기하분포를 경험합니다' },
  { num: '06', href: '/sim/06-galton',      title: '갈톤보드',          desc: '정규분포 수렴' },
  { num: '07', href: '/sim/07-height',      title: '남녀 키 분포',      desc: '성별 키 정규분포 + 베이즈 추론' },
  { num: '08', href: '/sim/08-geometric',   title: '조건부확률 (암 진단)', desc: '혼동행렬 + 직접 진단 입력' },
  { num: '09', href: '/sim/09-diabetes',    title: '룰렛 맞추기',       desc: '3종 룰렛 중 어느 것인지 추론' },
  { num: '10', href: '/sim/10-roulette',    title: '몬테카를로 π',      desc: '무작위 점으로 π 추정' },
  { num: '11', href: '/sim/11-pi',          title: '사다리타기',         desc: '랜덤 다리 생성 + 결과 확인' },
  { num: '12', href: '/sim/12-ladder',      title: '개미 최단경로',      desc: '페로몬 기반 ACO 시뮬레이션' },
];

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#111] mb-2">확률 시뮬레이션</h1>
      <p className="text-[#666] mb-8">12가지 인터랙티브 확률 실험</p>
      <ul className="space-y-3">
        {SIMS.map(({ num, href, title, desc }) => (
          <li key={num}>
            <Link
              href={href}
              className="group flex items-center gap-4 bg-[#f8f8f6] hover:bg-[#EEEDFE] border border-black/10 rounded-xl px-5 py-4 transition-colors"
            >
              <span className="w-9 h-9 rounded-lg bg-white border border-black/10 flex items-center justify-center text-sm font-bold text-[#534AB7] shrink-0">
                {num}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#111] group-hover:text-[#534AB7] transition-colors">{title}</p>
                <p className="text-sm text-[#666] mt-0.5">{desc}</p>
              </div>
              <span className="text-[#534AB7] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
