import React, { useMemo } from 'react';
import { BellRing } from 'lucide-react';
import { useGame } from '@/context/GameContext';

import AlertItem, { AlertEntry } from './AlertItem';

function buildAlerts(state: ReturnType<typeof useGame>['state']): AlertEntry[] {
  const player = state.countries[state.playerCountryId];
  if (!player) return [];

  const activeWars = state.wars.filter(war => war.active && (war.attackers.includes(player.id) || war.defenders.includes(player.id)));
  const tradePartners = state.tradeAgreements.filter(trade => trade.countries.includes(player.id)).length;
  const allianceCount = state.alliances.filter(alliance => alliance.members.includes(player.id)).length;
  const negativeResources = Object.entries(player.resourceIncome).filter(([, value]) => value < 0);

  const alerts: AlertEntry[] = [];

  if (activeWars.length > 0) {
    alerts.push({
      id: 'alert_active_war',
      category: 'war',
      title: 'War declared',
      detail: `${activeWars.length} active conflict${activeWars.length > 1 ? 's are' : ' is'} involving your country.`,
      severity: 'high',
    });
  }

  if (player.resourceIncome.food < 0 || player.resources.food < 40) {
    alerts.push({
      id: 'alert_starvation',
      category: 'starvation',
      title: 'Starvation risk',
      detail: `Food reserves are strained at ${Math.round(player.resources.food)} with a ${player.resourceIncome.food >= 0 ? '+' : ''}${Math.round(player.resourceIncome.food)} per-turn balance.`,
      severity: player.resourceIncome.food < -2 ? 'high' : 'medium',
    });
  }

  if (negativeResources.length > 0) {
    alerts.push({
      id: 'alert_deficit',
      category: 'economy',
      title: 'Economic deficit',
      detail: `${negativeResources.map(([key]) => key).join(', ')} ${negativeResources.length > 1 ? 'are' : 'is'} running negative per turn.`,
      severity: negativeResources.length > 2 ? 'high' : 'medium',
    });
  }

  if (tradePartners === 0 || allianceCount === 0) {
    alerts.push({
      id: 'alert_diplomacy',
      category: 'diplomacy',
      title: 'Diplomatic request',
      detail: tradePartners === 0
        ? 'Your country has no active trade agreements. Open diplomacy to secure imports and exports.'
        : 'Your country lacks formal alliances. Consider pursuing diplomatic guarantees.',
      severity: 'low',
    });
  }

  const latestRelevantEvent = [...state.events].reverse().find(event => {
    if (event.countryId === player.id) return true;
    return event.type === 'war' || event.type === 'diplomacy' || event.type === 'economy';
  });

  if (latestRelevantEvent) {
    alerts.push({
      id: `alert_event_${latestRelevantEvent.id}`,
      category: latestRelevantEvent.type === 'war' ? 'war' : latestRelevantEvent.type === 'economy' ? 'economy' : 'warning',
      title: latestRelevantEvent.title,
      detail: latestRelevantEvent.description,
      severity: latestRelevantEvent.type === 'war' ? 'high' : 'low',
    });
  }

  return alerts.slice(0, 4);
}

const AlertsBar: React.FC = () => {
  const { state } = useGame();
  const alerts = useMemo(() => buildAlerts(state), [state]);

  if (alerts.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-panel bg-panel/90 px-3 py-1.5">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <div className="flex shrink-0 items-center gap-1.5 px-1 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-primary">
          <BellRing size={11} className="text-primary/70" />
          Alerts
        </div>
        {alerts.map(alert => <AlertItem key={alert.id} item={alert} />)}
      </div>
    </div>
  );
};

export default React.memo(AlertsBar);