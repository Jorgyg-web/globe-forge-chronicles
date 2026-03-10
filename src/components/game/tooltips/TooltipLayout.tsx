import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const TooltipPanel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('min-w-[260px] space-y-3', className)}>{children}</div>
);

export const TooltipHeader = ({
  title,
  subtitle,
  value,
  accent,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  accent?: ReactNode;
}) => (
  <div className="border-b border-border/40 pb-2">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {accent}
          <span className="truncate text-sm font-semibold text-foreground">{title}</span>
        </div>
        {subtitle ? <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div> : null}
      </div>
      {value ? <div className="shrink-0 text-right text-sm font-mono font-bold text-foreground">{value}</div> : null}
    </div>
  </div>
);

export const TooltipSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
    <div className="space-y-1.5">{children}</div>
  </div>
);

export const TooltipRow = ({
  label,
  value,
  valueClassName,
}: {
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
}) => (
  <div className="flex items-center justify-between gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn('text-right font-mono text-foreground', valueClassName)}>{value}</span>
  </div>
);

export const TooltipMetricGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-2 gap-2">{children}</div>
);

export const TooltipMetric = ({
  label,
  value,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: 'positive' | 'negative' | 'neutral';
}) => (
  <div className="rounded-md border border-border/40 bg-background/30 px-2 py-1.5">
    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    <div
      className={cn(
        'mt-1 text-sm font-mono font-semibold text-foreground',
        tone === 'positive' && 'text-emerald-400',
        tone === 'negative' && 'text-rose-400',
        tone === 'neutral' && 'text-amber-300',
      )}
    >
      {value}
    </div>
  </div>
);

export const TooltipTagList = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap gap-1.5">{children}</div>
);

export const TooltipTag = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('rounded-md border border-border/40 bg-background/30 px-1.5 py-0.5 text-[10px] text-muted-foreground', className)}>
    {children}
  </span>
);
