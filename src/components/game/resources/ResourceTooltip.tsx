import React from 'react';

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
    <div className="min-w-[260px] space-y-3">
      <div className="border-b border-border/40 pb-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-foreground">{data.label}</span>
          <span className="text-sm font-mono font-bold text-foreground">{formatValue(data.currentValue)}</span>
        </div>
        <div className={`mt-1 text-xs font-mono ${data.changePerTurn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatDelta(data.changePerTurn)} / turno
        </div>
      </div>

      <div className="space-y-2">
        <Section title="Income sources" lines={data.incomeSources} formatValue={formatValue} positive />
        <Section title="Expenses" lines={data.expenses} formatValue={formatValue} />
      </div>

      <div className="border-t border-border/40 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Income</span>
          <span className="font-mono text-emerald-400">+{formatValue(incomeTotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Expenses</span>
          <span className="font-mono text-rose-400">-{formatValue(expenseTotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm font-semibold">
          <span className="text-foreground">Net balance</span>
          <span className={`font-mono ${data.changePerTurn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatDelta(data.changePerTurn)}
          </span>
        </div>
      </div>
    </div>
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
