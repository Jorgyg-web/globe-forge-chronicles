import type { ReactNode } from 'react';

import { ChevronLeft, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export const InfoPanelFrame = ({
  title,
  subtitle,
  icon,
  children,
  onBack,
  onClose,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  onBack?: () => void;
  onClose?: () => void;
}) => (
  <div className="flex h-full flex-col animate-panel-in">
    <div className="border-b border-border/50 px-3 pb-3 pt-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-border/50 bg-muted/20 p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Back"
            >
              <ChevronLeft size={14} />
            </button>
          ) : null}
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground">Information</span>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border/50 bg-muted/20 p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      <div className="flex items-start gap-3">
        {icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-foreground">{title}</h2>
          {subtitle ? <div className="mt-1 text-[11px] text-muted-foreground">{subtitle}</div> : null}
        </div>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
      <div className="space-y-3">{children}</div>
    </div>
  </div>
);

export const InfoSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="game-panel overflow-hidden">
    <div className="game-panel-header">
      <h3>{title}</h3>
    </div>
    <div className="space-y-2 px-3 py-2">{children}</div>
  </section>
);

export const InfoMetricGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-2 gap-2">{children}</div>
);

export const InfoMetric = ({
  label,
  value,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: 'positive' | 'negative' | 'neutral';
}) => (
  <div className="rounded-lg border border-border/40 bg-background/40 px-2.5 py-2">
    <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
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

export const InfoRow = ({
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

export const InfoBadge = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('rounded-md border border-border/40 bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground', className)}>{children}</span>
);

export const InfoListButton = ({
  title,
  subtitle,
  meta,
  accent,
  onClick,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  accent?: ReactNode;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full rounded-lg border border-border/40 bg-background/30 px-2.5 py-2 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
  >
    <div className="flex items-start gap-2">
      {accent ? <div className="mt-0.5 shrink-0 text-primary">{accent}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-semibold text-foreground">{title}</span>
          {meta ? <span className="shrink-0 text-[10px] font-mono text-muted-foreground">{meta}</span> : null}
        </div>
        {subtitle ? <div className="mt-1 text-[10px] text-muted-foreground">{subtitle}</div> : null}
      </div>
    </div>
  </button>
);

export const EmptyState = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-dashed border-border/40 bg-background/20 px-3 py-4 text-center text-[11px] text-muted-foreground">
    {children}
  </div>
);
