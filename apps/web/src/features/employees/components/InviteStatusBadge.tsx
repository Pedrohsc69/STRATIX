type InviteStatusBadgeProps = {
  status: "PENDING" | "EXPIRED";
};

export function InviteStatusBadge({ status }: InviteStatusBadgeProps) {
  const config =
    status === "EXPIRED"
      ? {
          label: "Convite expirado",
          tone: "bg-[#FEE2E2] text-[#991B1B]",
        }
      : {
          label: "Convite pendente",
          tone: "bg-[#FEF3C7] text-[#92400E]",
        };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config.tone}`}>
      {config.label}
    </span>
  );
}
