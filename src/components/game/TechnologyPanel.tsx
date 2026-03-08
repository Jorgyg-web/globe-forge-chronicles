import { useGame } from '@/context/GameContext';
import { TECHNOLOGIES, TECH_CATEGORIES, TECH_CATEGORY_INFO } from '@/data/technologies';
import { FlaskConical, Lock, Check, Loader2, Zap, X } from 'lucide-react';

const TechnologyPanel = () => {
  const { state, dispatch } = useGame();
  const country = state.countries[state.playerCountryId];
  const tech = country.technology;

  const canResearch = (t: typeof TECHNOLOGIES[0]) =>
    !tech.researched.includes(t.id) &&
    t.prerequisites.every(p => tech.researched.includes(p)) &&
    !tech.activeResearch.some(r => r.techId === t.id);

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
        <FlaskConical size={14} className="text-primary" />
        Research & Technology
      </h2>

      <div className="grid grid-cols-2 gap-2">
        <div className="stat-card">
          <div className="flex items-center gap-1 mb-0.5">
            <Check size={10} className="text-success" />
            <span className="text-[10px] text-muted-foreground">Completed</span>
          </div>
          <p className="text-sm font-mono font-bold text-foreground">{tech.researched.length}/{TECHNOLOGIES.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1 mb-0.5">
            <Zap size={10} className="text-primary" />
            <span className="text-[10px] text-muted-foreground">Slots</span>
          </div>
          <p className="text-sm font-mono font-bold text-foreground">{tech.activeResearch.length}/{country.researchSlots}</p>
        </div>
      </div>

      {/* Active Research */}
      {tech.activeResearch.length > 0 && (
        <div className="game-panel border-primary/30 glow-primary">
          <div className="game-panel-header">
            <Loader2 size={11} className="text-primary animate-spin" />
            <h3>Active Research</h3>
          </div>
          <div className="p-3 space-y-2">
            {tech.activeResearch.map(ar => {
              const t = TECHNOLOGIES.find(t => t.id === ar.techId);
              if (!t) return null;
              const pct = (ar.progress / t.cost) * 100;
              return (
                <div key={ar.techId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{t.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground">{ar.progress}/{t.cost}</span>
                      <button onClick={() => dispatch({ type: 'CANCEL_RESEARCH', countryId: state.playerCountryId, techId: ar.techId })}
                        className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500 progress-shimmer" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tech Tree */}
      {TECH_CATEGORIES.map(cat => {
        const techs = TECHNOLOGIES.filter(t => t.category === cat).sort((a, b) => a.tier - b.tier);
        const info = TECH_CATEGORY_INFO[cat];
        const completed = techs.filter(t => tech.researched.includes(t.id)).length;

        return (
          <div key={cat} className="game-panel">
            <div className="game-panel-header">
              <span className="text-sm">{info.icon}</span>
              <h3>{info.name}</h3>
              <span className="text-[9px] font-mono text-muted-foreground ml-auto">{completed}/{techs.length}</span>
            </div>
            <div className="divide-y divide-border/20">
              {techs.map(t => {
                const isResearched = tech.researched.includes(t.id);
                const isActive = tech.activeResearch.some(r => r.techId === t.id);
                const available = canResearch(t);
                const locked = !isResearched && !available && !isActive;

                return (
                  <div key={t.id} className={`p-2.5 transition-all ${locked ? 'opacity-35' : 'hover:bg-muted/20'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {isResearched ? (
                          <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center"><Check size={10} className="text-success" /></div>
                        ) : isActive ? (
                          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"><Loader2 size={10} className="text-primary animate-spin" /></div>
                        ) : locked ? (
                          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center"><Lock size={9} className="text-muted-foreground" /></div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-primary/50 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-primary" /></div>
                        )}
                        <div>
                          <span className={`text-xs font-medium ${isResearched ? 'text-stat-positive' : 'text-foreground'}`}>{t.name}</span>
                          <span className="text-[9px] text-muted-foreground ml-2">Tier {t.tier}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground">{t.cost} RP</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground ml-6 mb-1">{t.description}</p>
                    <p className="text-[10px] text-stat-positive ml-6">{t.effects.map(e => e.description).join(' · ')}</p>
                    {t.unlocksUnit && <p className="text-[10px] text-primary ml-6">Unlocks: {t.unlocksUnit}</p>}
                    {available && tech.activeResearch.length < country.researchSlots && (
                      <button onClick={() => dispatch({ type: 'START_RESEARCH', countryId: state.playerCountryId, techId: t.id })}
                        className="ml-6 mt-1.5 game-btn-primary">Research</button>
                    )}
                    {locked && t.prerequisites.length > 0 && (
                      <p className="text-[9px] text-muted-foreground ml-6 mt-1 flex items-center gap-1">
                        <Lock size={8} /> Requires: {t.prerequisites.map(p => TECHNOLOGIES.find(tt => tt.id === p)?.name).join(', ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TechnologyPanel;
