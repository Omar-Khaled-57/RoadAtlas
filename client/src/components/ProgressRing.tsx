import type { CSSProperties } from 'react';

interface ProgressRingProps {
  value: number;
  /** Accessible name for the progressbar (also shown as the small caption). */
  label: string;
  /** Optional emphatic line under the label. */
  caption?: string;
}

export function ProgressRing({ value, label, caption }: ProgressRingProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="progress-ring"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        style={{ '--progress': `${value * 3.6}deg` } as CSSProperties}
      >
        <span>
          {value}
          <small>%</small>
        </span>
      </div>
      <div>
        <p className="text-xs text-fg-muted">{label}</p>
        {caption ? <p className="font-semibold text-fg-primary">{caption}</p> : null}
      </div>
    </div>
  );
}
