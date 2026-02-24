interface MissionCardProps {
  icon: string;
  title: string;
  description: string;
  completed: boolean;
  reward: number;
}

export function MissionCard({ icon, title, description, completed, reward }: MissionCardProps) {
  return (
    <div className={`p-6 rounded-xl border transition-all ${
      completed
        ? 'bg-emerald-500/10 border-emerald-500/30'
        : 'bg-slate-900/50 border-slate-700 hover:border-indigo-500/50'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h4 className={`font-bold ${completed ? 'text-emerald-400 line-through' : 'text-white'}`}>
              {title}
            </h4>
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          </div>
        </div>
        <div className="text-right">
          {completed && (
            <>
              <p className="text-xs text-slate-400 mb-1">완료!</p>
              <span className="inline-block bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold">
                +{reward} XP
              </span>
            </>
          )}
          {!completed && (
            <span className="inline-block bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs font-bold">
              +{reward} XP
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
