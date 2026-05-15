'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',                    label: '목차' },
  { href: '/sim/01-coin',         label: '01  동전 (50:50)' },
  { href: '/sim/02-dice',         label: '02  6면 주사위' },
  { href: '/sim/03-biased-dice',  label: '03  이상한 주사위' },
  { href: '/sim/04-bent-coin',    label: '04  이상한 동전' },
  { href: '/sim/05-coin-10000',   label: '05  3이 나올 때까지' },
  { href: '/sim/06-galton',       label: '06  갈톤보드' },
  { href: '/sim/07-height',       label: '07  남녀 키 분포' },
  { href: '/sim/08-geometric',    label: '08  조건부확률' },
  { href: '/sim/09-diabetes',     label: '09  룰렛 맞추기' },
  { href: '/sim/10-roulette',     label: '10  몬테카를로 π' },
  { href: '/sim/11-pi',           label: '11  사다리타기' },
  { href: '/sim/12-ladder',       label: '12  개미 최단경로' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="fixed top-0 left-0 w-56 h-screen bg-white border-r border-black/10 flex flex-col overflow-y-auto z-40">
      <div className="px-4 py-5 border-b border-black/10">
        <p className="text-xs font-bold text-[#534AB7] tracking-widest uppercase">Prob Sim</p>
      </div>
      <ul className="flex-1 py-2">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`block px-4 py-2 text-sm rounded-lg mx-2 my-0.5 transition-colors ${
                  active
                    ? 'bg-[#EEEDFE] text-[#534AB7] font-medium'
                    : 'text-[#333] hover:bg-[#f0f0f0]'
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
