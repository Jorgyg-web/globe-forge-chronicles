import { useGame } from '@/context/GameContext';
import { TECHNOLOGIES } from '@/data/technologies';

const TechnologyPanel = () => {
  const { state, dispatch } = useGame();
  const country = state.countries[state.playerCountryId];
  const tech = country.technology;

  const categories = ['military', 'economy', 'infrastructure', 'industry', 'energy'] as const;

  const canResearch = (t: typeof TECHNOLOGIES[0]) =>
    !tech.researched.includes(t.id) &&
    t.prerequisites.every(p => tech.researched.includes(p)) &&
    tech.currentResearch !== t.id;

  return (
    <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin h-full">
      <h2 className="text-sm font-bold text-foreground">Research & Technology</h2>

      {/* Current Research */}
      {tech.currentResearch && (
        <div className="border border-primary/50 rounded-md overflow-hidden glow-primary">
          <div className="bg-primary/10 px-3 py-1.5 border-b border-primary/30">
            <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Researching</h3>
          </div>
          <div className="p-3">
            <p className="text-xs font-medium text-foreground">{TECHNOLOGIES.find(t => t.id === tech.currentResearch)?.name}</p>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(tech.currentProgress / (TECHNOLOGIES.find(t => t.id === tech.currentResearch)?.cost || 1)) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
              {tech.currentProgress} / {TECHNOLOGIES.find(t => t.id === tech.currentResearch)?.cost} ({tech.researchPerTurn}/turn)
            </p>
          </div>
        </div>
      )}

      {/* Research Stats */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-panel-header px-3 py-1.5 border-b border-border">
          <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Research Output</h3>
        </div>
        <div className="p-3 flex gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground">Per Turn</p>
            <p className="text-sm font-mono font-bold text-foreground">{tech.researchPerTurn}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Completed</p>
            <p className="text-sm font-mono font-bold text-foreground">{tech.researched.length}</p>
          </div>
        </div>
      </div>

      {/* Tech Tree by Category */}
      {categories.map(cat => {
        const techs = TECHNOLOGIES.filter(t => t.category === cat);
        return (
          <div key={cat} className="border border-border rounded-md overflow-hidden">
            <div className="bg-panel-header px-3 py-1.5 border-b border-border">
              <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">{cat}</h3>
            </div>
            <div className="divide-y divide-border/50">
              {techs.map(t => {
                const isResearched = tech.researched.includes(t.id);
                const isCurrent = tech.currentResearch === t.id;
                const available = canResearch(t);
                const locked = !isResearched && !available && !isCurrent;

                return (
                  <div key={t.id} className={`p-3 ${locked ? 'opacity-40' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${isResearched ? 'text-stat-positive' : 'text-foreground'}`}>
                        {isResearched ? '✓ ' : ''}{t.name}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">{t.cost} RP</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1">{t.description}</p>
                    <p className="text-[10px] text-stat-positive">{t.effects.map(e => e.description).join(', ')}</p>
                    {available && !tech.currentResearch && (
                      <button
                        onClick={() => dispatch({ type: 'START_RESEARCH', countryId: state.playerCountryId, techId: t.id })}
                        className="mt-2 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-mono rounded hover:opacity-90 transition-opacity"
                      >
                        Research
                      </button>
                    )}
                    {t.prerequisites.length > 0 && locked && (
                      <p className="text-[10px] text-muted-foreground mt-1">
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
