interface LevelBadgeProps {
  level: string;
  size?: 'sm' | 'md' | 'lg';
}

const levelColors = {
  'A1': 'bg-green-500/20 border-green-500/50 text-green-400',
  'A2': 'bg-green-600/20 border-green-600/50 text-green-500',
  'B1': 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  'B2': 'bg-blue-600/20 border-blue-600/50 text-blue-500',
  'C1': 'bg-purple-500/20 border-purple-500/50 text-purple-400',
  'C2': 'bg-purple-600/20 border-purple-600/50 text-purple-500',
};

const levelKorean = {
  'A1': '초급 1',
  'A2': '초급 2',
  'B1': '중급 1',
  'B2': '중급 2',
  'C1': '고급 1',
  'C2': '고급 2',
};

export function LevelBadge({ level, size = 'md' }: LevelBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`${sizeClasses[size]} border rounded-full font-bold ${levelColors[level as keyof typeof levelColors] || levelColors['A1']}`}>
      {level}
      <span className="hidden sm:inline ml-1">({levelKorean[level as keyof typeof levelKorean]})</span>
    </span>
  );
}
