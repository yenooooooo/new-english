interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
}

export function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        {icon && <span className="text-4xl">{icon}</span>}
        <h2 className="text-4xl md:text-5xl font-extrabold text-white">
          {title}
        </h2>
      </div>
      {description && (
        <p className="text-slate-400 text-lg mt-2">
          {description}
        </p>
      )}
    </div>
  );
}
