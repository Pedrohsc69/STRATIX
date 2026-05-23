type ProgressIndicatorProps = {
  value: number;
  tone?: "brand" | "success" | "warning" | "danger";
};

export function ProgressIndicator({
  value,
  tone = "brand",
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
      <div className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
        <div
          className={`h-full rounded-full ${toneClasses[tone]}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <p className="text-xs font-medium text-[#6B7280] mt-2">{clampedValue}%</p>
    </div>
  );
}
