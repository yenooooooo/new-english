interface StreakBannerProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakBanner({ currentStreak, longestStreak }: StreakBannerProps) {
  return (
    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🔥</span>
          <div>
            <p className="text-sm text-slate-400">연속 학습일</p>
            <p className="text-3xl font-bold text-white">{currentStreak}일</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <span className="text-3xl">✨</span>
          <div>
            <p className="text-sm text-slate-400">최장 기록</p>
            <p className="text-2xl font-bold text-orange-400">{longestStreak}일</p>
          </div>
        </div>

        {currentStreak > 0 && (
          <div className="text-xs text-slate-400 sm:text-sm">
            💪 내일도 학습하면 {currentStreak + 1}일 기록 갱신!
          </div>
        )}
      </div>
    </div>
  );
}
