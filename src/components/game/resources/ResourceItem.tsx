import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ResourceTooltip, { ResourceTooltipData } from './ResourceTooltip';

export interface ResourceItemData extends ResourceTooltipData {
  key: string;
  icon: React.ReactNode;
  accentClassName: string;
}

interface ResourceItemProps {
  item: ResourceItemData;
  formatValue: (value: number) => string;
  formatDelta: (value: number) => string;
}

export const ResourceItem: React.FC<ResourceItemProps> = ({ item, formatValue, formatDelta }) => {
  const positive = item.changePerTurn >= 0;

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="group flex min-w-[165px] flex-1 items-center gap-3 rounded-xl border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-primary/40 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))]"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-background/30 ${item.accentClassName}`}>
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {item.label}
              </div>
              <div className="mt-1 flex items-end justify-between gap-2">
                <span className="truncate text-lg font-mono font-bold leading-none text-foreground">
                  {formatValue(item.currentValue)}
                </span>
                <span className={`shrink-0 text-xs font-mono font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatDelta(item.changePerTurn)}
                </span>
              </div>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="border-primary/15 bg-slate-950/95 p-3 text-popover-foreground backdrop-blur-sm">
          <ResourceTooltip data={item} formatValue={formatValue} formatDelta={formatDelta} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ResourceItem;
