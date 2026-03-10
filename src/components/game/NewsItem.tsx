import React from 'react';
import { AlertTriangle, Globe2, Handshake, Newspaper, ShieldBan, Swords, TrendingDown } from 'lucide-react';

export type NewsCategory = 'war' | 'alliance' | 'economy' | 'diplomacy' | 'trade' | 'embargo' | 'peace';

export interface NewsFeedEntry {
  id: string;
  turn: number;
  category: NewsCategory;
  headline: string;
  summary: string;
  tag: string;
  countries?: Array<{ id: string; name: string; color: string }>;
  priority?: number;
  live?: boolean;
}

const NEWS_ICON: Record<NewsCategory, React.ReactNode> = {
  war: <Swords size={12} className="text-danger" />,
  alliance: <Handshake size={12} className="text-info" />,
  economy: <TrendingDown size={12} className="text-warning" />,
  diplomacy: <Globe2 size={12} className="text-primary" />,
  trade: <Handshake size={12} className="text-success" />,
  embargo: <ShieldBan size={12} className="text-warning" />,
  peace: <Newspaper size={12} className="text-success" />,
};

const NEWS_ACCENT: Record<NewsCategory, string> = {
  war: 'bg-danger/10 border-danger/20',
  alliance: 'bg-info/10 border-info/20',
  economy: 'bg-warning/10 border-warning/20',
  diplomacy: 'bg-primary/10 border-primary/20',
  trade: 'bg-success/10 border-success/20',
  embargo: 'bg-warning/10 border-warning/20',
  peace: 'bg-success/10 border-success/20',
};

interface NewsItemProps {
  item: NewsFeedEntry;
}

const NewsItem: React.FC<NewsItemProps> = ({ item }) => {
  return (
    <article className={`rounded-md border px-3 py-2 transition-all hover:brightness-110 ${NEWS_ACCENT[item.category]}`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">{NEWS_ICON[item.category]}</div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {item.tag}
            </span>
            {item.live ? (
              <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[8px] font-mono font-semibold uppercase tracking-[0.14em] text-warning">
                Live
              </span>
            ) : null}
            <span className="ml-auto text-[9px] font-mono text-muted-foreground">T{item.turn}</span>
          </div>

          <h4 className="truncate text-[11px] font-semibold text-foreground">{item.headline}</h4>
          <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">{item.summary}</p>

          {item.countries && item.countries.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.countries.map(country => (
                <span
                  key={`${item.id}_${country.id}`}
                  className="rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold"
                  style={{ backgroundColor: `${country.color}22`, color: country.color }}
                >
                  {country.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export const NewsEmptyState = () => (
  <div className="flex h-full items-center justify-center">
    <div className="space-y-1 text-center">
      <AlertTriangle size={16} className="mx-auto text-muted-foreground/30" />
      <p className="text-[10px] text-muted-foreground">No headlines yet. Advance turns to generate world news.</p>
    </div>
  </div>
);

export default React.memo(NewsItem);