import React from 'react';

import { TooltipHeader, TooltipPanel, TooltipRow, TooltipSection } from '@/components/game/tooltips/TooltipLayout';

export interface ResourceBreakdownLine {
  label: string;
  value: number;
}

export interface ResourceTooltipData {
  label: string;
  currentValue: number;
  changePerTurn: number;
  incomeSources: ResourceBreakdownLine[];
  expenses: ResourceBreakdownLine[];
}

interface ResourceTooltipProps {
  data: ResourceTooltipData;
  formatValue: (value: number) => string;
  formatDelta: (value: number) => string;
}

function sumLines(lines: ResourceBreakdownLine[]): number {
  return lines.reduce((sum, line) => sum + line.value, 0);
}

export const ResourceTooltip: React.FC<ResourceTooltipProps> = ({ data, formatValue, formatDelta }) => {
  const incomeTotal = sumLines(data.incomeSources);
  const expenseTotal = sumLines(data.expenses);

  return (
    <TooltipPanel>
      <TooltipHeader
        title={data.label}
        subtitle={<span className={`font-mono ${data.changePerTurn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatDelta(data.changePerTurn)} / turn</span>}
        value={formatValue(data.currentValue)}
      />

      <div className="space-y-2">
        <Section title="Income sources" lines={data.incomeSources} formatValue={formatValue} positive />
        <Section title="Expenses" lines={data.expenses} formatValue={formatValue} />
      </div>

      <TooltipSection title="Balance summary">
        <TooltipRow label="Income" value={`+${formatValue(incomeTotal)}`} valueClassName="text-emerald-400" />
        <TooltipRow label="Expenses" value={`-${formatValue(expenseTotal)}`} valueClassName="text-rose-400" />
        <TooltipRow label="Net balance" value={formatDelta(data.changePerTurn)} valueClassName={data.changePerTurn >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
      </TooltipSection>
    </TooltipPanel>
  );
};

const Section = ({
  title,
  lines,
  formatValue,
  positive,
}: {
  title: string;
  lines: ResourceBreakdownLine[];
  formatValue: (value: number) => string;
  positive?: boolean;
}) => (
  <div>
    <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
    <div className="space-y-1">
      {lines.map(line => (
        <div key={line.label} className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">{line.label}</span>
          <span className={`font-mono ${positive ? 'text-emerald-400' : 'text-foreground'}`}>
            {positive ? '+' : '-'}{formatValue(line.value)}
          </span>
        </div>
      ))}
      {lines.length === 0 && <div className="text-xs text-muted-foreground">No data</div>}
    </div>
  </div>
);

export default ResourceTooltip;
