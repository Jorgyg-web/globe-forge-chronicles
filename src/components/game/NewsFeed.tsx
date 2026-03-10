import React, { useMemo } from 'react';
import { Newspaper } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { RESOURCE_KEYS, Country, GameEvent } from '@/types/game';

import NewsItem, { NewsEmptyState, NewsFeedEntry } from './NewsItem';

function eventToNewsItem(event: GameEvent, countries: Record<string, Country>): NewsFeedEntry {
  const eventCountry = event.countryId ? countries[event.countryId] : undefined;
  const normalizedSummary = event.description
    .replace(' has declared war on ', ' declared war on ')
    .replace(' formed a both alliance', ' formed a comprehensive alliance')
    .replace(' formed a military alliance', ' formed a military alliance')
    .replace(' formed a economic alliance', ' formed an economic alliance');

  let category: NewsFeedEntry['category'] = 'diplomacy';
  let tag = 'Diplomacy';
  let headline = normalizedSummary;

  if (event.type === 'war') {
    category = 'war';
    tag = 'War';
    headline = normalizedSummary;
  } else if (/trade agreement/i.test(event.description)) {
    category = 'trade';
    tag = 'Trade';
    headline = normalizedSummary;
  } else if (/alliance/i.test(event.description)) {
    category = 'alliance';
    tag = 'Alliance';
    headline = normalizedSummary;
  } else if (/embargo/i.test(event.description)) {
    category = 'embargo';
    tag = 'Embargo';
    headline = normalizedSummary;
  } else if (/peace treaty/i.test(event.description)) {
    category = 'peace';
    tag = 'Peace';
    headline = normalizedSummary;
  } else if (event.type === 'economy' || event.type === 'disaster') {
    category = 'economy';
    tag = 'Economy';
    headline = event.title;
  }

  return {
    id: event.id,
    turn: event.turn,
    category,
    headline,
    summary: normalizedSummary,
    tag,
    countries: eventCountry
      ? [{ id: eventCountry.id, name: eventCountry.name, color: eventCountry.color }]
      : undefined,
    priority: event.type === 'war' ? 5 : category === 'economy' ? 4 : 3,
  };
}

function buildEconomicCrisisEntries(state: ReturnType<typeof useGame>['state']): NewsFeedEntry[] {
  return Object.values(state.countries)
    .map(country => {
      const negativeIncome = RESOURCE_KEYS.filter(key => country.resourceIncome[key] < 0).length;
      const lowStockpile = RESOURCE_KEYS.filter(key => country.resources[key] < 50).length;
      const instabilityScore = (country.stability < 35 ? 2 : 0)
        + (country.approval < 35 ? 1 : 0)
        + (country.government.corruption > 45 ? 1 : 0)
        + (negativeIncome > 1 ? 1 : 0)
        + (lowStockpile > 2 ? 1 : 0);

      if (instabilityScore < 2) return null;

      const reasons = [
        country.stability < 35 ? 'low stability' : null,
        country.approval < 35 ? 'falling approval' : null,
        country.government.corruption > 45 ? 'high corruption' : null,
        negativeIncome > 1 ? 'resource deficits' : null,
        lowStockpile > 2 ? 'depleted reserves' : null,
      ].filter(Boolean) as string[];

      return {
        id: `economic_crisis_${country.id}`,
        turn: state.turn,
        category: 'economy' as const,
        headline: `${country.name} faces an economic crisis`,
        summary: `${country.name} is under pressure from ${reasons.join(', ')}.`,
        tag: 'Economy',
        countries: [{ id: country.id, name: country.name, color: country.color }],
        priority: 6 + instabilityScore,
        live: true,
      };
    })
    .filter((item): item is NewsFeedEntry => item !== null)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .slice(0, 4);
}

const NewsFeed: React.FC = () => {
  const { state } = useGame();

  const items = useMemo(() => {
    const eventItems = state.events.map(event => eventToNewsItem(event, state.countries));
    const crisisItems = buildEconomicCrisisEntries(state);

    return [...crisisItems, ...eventItems]
      .sort((a, b) => {
        if ((a.live ? 1 : 0) !== (b.live ? 1 : 0)) return (b.live ? 1 : 0) - (a.live ? 1 : 0);
        if (a.turn !== b.turn) return b.turn - a.turn;
        return (b.priority ?? 0) - (a.priority ?? 0);
      })
      .slice(0, 36);
  }, [state]);

  return (
    <div className="relative flex h-full flex-col border-t border-panel bg-panel">
      <div className="absolute left-0 right-0 top-8 z-10 h-4 bg-gradient-to-b from-[hsl(var(--panel))] to-transparent pointer-events-none" />

      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-panel-header px-3 py-1.5">
        <Newspaper size={11} className="text-primary/70" />
        <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-primary">World News</h3>
        <span className="ml-auto text-[9px] font-mono text-muted-foreground">{items.length} headlines</span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2 scrollbar-thin">
        {items.length === 0 ? <NewsEmptyState /> : items.map(item => <NewsItem key={item.id} item={item} />)}
      </div>
    </div>
  );
};

export default React.memo(NewsFeed);