import React from 'react';
import { AlertTriangle, Bell, Handshake, ShieldAlert, Swords, Wheat } from 'lucide-react';

export type AlertCategory = 'war' | 'economy' | 'starvation' | 'diplomacy' | 'warning';

export interface AlertEntry {
  id: string;
  category: AlertCategory;
  title: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
}

const ALERT_ICON: Record<AlertCategory, React.ReactNode> = {
  war: <Swords size={12} className="text-danger" />,
  economy: <AlertTriangle size={12} className="text-warning" />,
  starvation: <Wheat size={12} className="text-warning" />,
  diplomacy: <Handshake size={12} className="text-info" />,
  warning: <ShieldAlert size={12} className="text-warning" />,
};

const ALERT_STYLE: Record<AlertEntry['severity'], string> = {
  high: 'border-danger/30 bg-danger/10 text-danger',
  medium: 'border-warning/30 bg-warning/10 text-warning',
  low: 'border-info/30 bg-info/10 text-info',
};

const AlertItem: React.FC<{ item: AlertEntry }> = ({ item }) => (
  <div className={`flex min-w-[220px] items-start gap-2 rounded-md border px-3 py-2 ${ALERT_STYLE[item.severity]}`}>
    <div className="mt-0.5 shrink-0">{ALERT_ICON[item.category] ?? <Bell size={12} />}</div>
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em]">{item.title}</div>
      <div className="text-[10px] text-foreground/85 line-clamp-2">{item.detail}</div>
    </div>
  </div>
);

export default React.memo(AlertItem);