import { useGame } from '@/context/GameContext';
import { TECHNOLOGIES } from '@/data/technologies';
import { FlaskConical, Lock, Check, Loader2, Zap } from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  military: { icon: '⚔️', color: 'hsl(0, 60%, 50%)' },
  economy: { icon: '📊', color: 'hsl(42, 100%, 58%)' },
  infrastructure: { icon: '🏗️', color: 'hsl(210, 60%, 50%)' },
  industry: { icon: '🏭', color: 'hsl(270, 50%, 55%)' },
  energy: { icon: '⚡', color: 'hsl(45, 90%, 55%)' },
};

const TechnologyPanel = () => {
  const { state, dispatch } = useGame();
  const country = state.countries[state.playerCountryId];
  const tech = country.technology;

  const categories = ['military', 'economy', 'infrastructure', 'industry', 'energy'] as const;

  const canResearch = (t: typeof TECHNOLOGIES[0]) =>
    !tech.researched.includes(t.id) &&
    t.prerequisites.every(p => tech.researched.includes(p)) &&
    tech.currentResearch !== t.id;

  const currentTech = TECHNOLOGIES.find(t => t.id === tech.currentResearch);

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
        <FlaskConical size={14} className="text-primary" />
        Research & Technology
      </h2>

      {/* Research stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="stat-card">
          <div className="flex items-center gap-1 mb-0.5">
            <Zap size={10} className="text-primary" />
            <span className="text-[10px] text-muted-foreground">Per Turn</span>
          </div>
          <p className="text-sm font-mono font-bold text-foreground">{tech.researchPerTurn} RP</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1 mb-0.5">
            <Check size={10} className="text-success" />
            <span className="text-[10px] text-muted-foreground">Completed</span>
          </div>
          <p className="text-sm font-mono font-bold text-foreground">{tech.researched.length}/{TECHNOLOGIES.length}</p>
        </div>
      </div>

      {/* Current Research */}
      {currentTech && (
        <div className="game-panel border-primary/30 glow-primary">
          <div className="game-panel-header">
            <Loader2 size={11} className="text-primary animate-spin" />
            <h3>Researching</h3>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">{currentTech.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {tech.currentProgress}/{currentTech.cost}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 progress-shimmer"
                style={{ width: `${(tech.currentProgress / currentTech.cost) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">
              ~{Math.ceil((currentTech.cost - tech.currentProgress) / tech.researchPerTurn)} turns remaining
            </p>
          </div>
        </div>
      )}

      {/* Tech Tree by Category */}
      {categories.map(cat => {
        const techs = TECHNOLOGIES.filter(t => t.category === cat);
        const config = CATEGORY_CONFIG[cat];
        const completed = techs.filter(t => tech.researched.includes(t.id)).length;

        return (
          <div key={cat} className="game-panel">
            <div className="game-panel-header">
              <span className="text-sm">{config.icon}</span>
              <h3 className="capitalize">{cat}</h3>
              <span className="text-[9px] font-mono text-muted-foreground ml-auto">{completed}/{techs.length}</span>
            </div>
            <div className="divide-y divide-border/20">
              {techs.map(t => {
                const isResearched = tech.researched.includes(t.id);
                const isCurrent = tech.currentResearch === t.id;
                const available = canResearch(t);
                const locked = !isResearched && !available && !isCurrent;

                return (
                  <div key={t.id} className={`p-2.5 transition-all ${locked ? 'opacity-35' : 'hover:bg-muted/20'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {isResearched ? (
                          <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
                            <Check size={10} className="text-success" />
                          </div>
                        ) : locked ? (
                          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                            <Lock size={9} className="text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-primary/50 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          </div>
                        )}
                        <span className={`text-xs font-medium ${isResearched ? 'text-stat-positive' : 'text-foreground'}`}>
                          {t.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground">{t.cost} RP</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground ml-6 mb-1">{t.description}</p>
                    <p className="text-[10px] text-stat-positive ml-6">{t.effects.map(e => e.description).join(' • ')}</p>
                    {available && !tech.currentResearch && (
                      <button
                        onClick={() => dispatch({ type: 'START_RESEARCH', countryId: state.playerCountryId, techId: t.id })}
                        className="ml-6 mt-1.5 game-btn-primary"
                      >
                        Research
                      </button>
                    )}
                    {t.prerequisites.length > 0 && locked && (
                      <p className="text-[9px] text-muted-foreground ml-6 mt-1 flex items-center gap-1">
                        <Lock size={8} />
                        Requires: {t.prerequisites.map(p => TECHNOLOGIES.find(tt => tt.id === p)?.name).join(', ')}
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
