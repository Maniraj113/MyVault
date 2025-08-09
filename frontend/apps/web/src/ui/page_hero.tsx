type Tone = 'primary' | 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'blue';

const toneToGradient: Record<Tone, string> = {
  primary: 'from-primary-700 to-primary-500',
  blue: 'from-blue-700 to-blue-500',
  indigo: 'from-indigo-700 to-indigo-500',
  cyan: 'from-cyan-700 to-cyan-500',
  emerald: 'from-emerald-700 to-emerald-500',
  amber: 'from-amber-600 to-amber-400',
  rose: 'from-rose-700 to-rose-500',
};

export function PageHero({
  title,
  subtitle,
  tone = 'primary',
  actionLabel,
}: {
  title: string;
  subtitle?: string;
  tone?: Tone;
  actionLabel?: string;
}): JSX.Element {
  return (
    <div className={`rounded-xl bg-gradient-to-r ${toneToGradient[tone]} text-white p-6 lg:p-8 shadow-card flex items-center justify-between`}>
      <div>
        <div className="text-xl font-semibold">{title}</div>
        {subtitle && <div className="text-sm/6 opacity-90">{subtitle}</div>}
      </div>
      {actionLabel && (
        <button className="rounded-lg bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-medium text-white">
          {actionLabel}
        </button>
      )}
    </div>
  );
}


