import Link from 'next/link';

export default function SimLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-[#534AB7] hover:underline">← 목차로</Link>
        <h1 className="text-2xl font-bold text-[#111] mt-2">{title}</h1>
        {description && <p className="text-[#666] mt-1 text-sm">{description}</p>}
      </div>
      {children}
    </div>
  );
}
