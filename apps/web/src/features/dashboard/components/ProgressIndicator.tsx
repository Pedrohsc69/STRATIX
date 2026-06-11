type ProgressIndicatorProps = {
  value: number;
  tone?: "brand" | "success" | "warning" | "danger";
  label?: string;
};

export function ProgressIndicator({
  value,
  tone = "brand",
  label,
}: ProgressIndicatorProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const toneClasses = {
    brand: "bg-[#1E4E79]",
    success: "bg-[#16A34A]",
    warning: "bg-[#D97706]",
    danger: "bg-[#DC2626]",
  };

  return (
    <div className="w-full">
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full ${toneClasses[tone]}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-medium text-[#6B7280] dark:text-slate-400">
        {label ?? `${clampedValue}%`}
      </p>
    </div>
  );
}
