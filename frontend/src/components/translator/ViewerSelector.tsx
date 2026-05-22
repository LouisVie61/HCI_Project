import { Clapperboard, UserRound } from 'lucide-react';

export type ViewerMode = 'video' | 'pose';

interface ViewerSelectorProps {
  value: ViewerMode;
  onChange: (mode: ViewerMode) => void;
}

const options = [
  { value: 'video' as const, label: 'Video', icon: Clapperboard },
  { value: 'pose' as const, label: 'Pose', icon: UserRound },
];

export const ViewerSelector = ({ value, onChange }: ViewerSelectorProps) => (
  <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
    {options.map((option) => {
      const Icon = option.icon;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
            value === option.value
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Icon className="size-4" />
          {option.label}
        </button>
      );
    })}
  </div>
);
