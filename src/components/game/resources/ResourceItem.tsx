import React from 'react';
import { StrategyTooltip, StrategyTooltipContent, StrategyTooltipProvider, StrategyTooltipTrigger } from '@/components/game/tooltips/StrategyTooltip';
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
    <StrategyTooltipProvider>
      <StrategyTooltip>
        <StrategyTooltipTrigger asChild>
          <button
            type="button"
            className="group flex shrink-0 items-center gap-2 rounded-lg border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-2.5 py-1.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-primary/40 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))]"
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-current/20 bg-background/30 ${item.accentClassName}`}>
              {item.icon}
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="truncate text-sm font-mono font-bold leading-none text-foreground">
                  {formatValue(item.currentValue)}
                </span>
                <span className={`shrink-0 text-[11px] font-mono font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({formatDelta(item.changePerTurn)})
                </span>
              </div>
            </div>
          </button>
        </StrategyTooltipTrigger>
        <StrategyTooltipContent side="bottom" align="start">
          <ResourceTooltip data={item} formatValue={formatValue} formatDelta={formatDelta} />
        </StrategyTooltipContent>
      </StrategyTooltip>
    </StrategyTooltipProvider>
  );
};

export default ResourceItem;
