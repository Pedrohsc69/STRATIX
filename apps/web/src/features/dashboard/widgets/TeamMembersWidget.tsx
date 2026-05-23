import { Shield, User, UserCog } from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import type { TeamMemberItem } from "../dashboard.types";

type TeamMembersWidgetProps = {
  members: TeamMemberItem[];
};

const roleIconMap = {
  DIRECTOR: Shield,
  MANAGER: UserCog,
  EMPLOYEE: User,
};

const roleLabelMap = {
  DIRECTOR: "Diretor",
  MANAGER: "Gestor",
  EMPLOYEE: "Colaborador",
};

export function TeamMembersWidget({ members }: TeamMembersWidgetProps) {
  return (
    <DashboardCard title="Equipe" subtitle="Pessoas recentes no escopo atual">
      <div className="space-y-3">
        {members.map((member) => {
          const Icon = roleIconMap[member.role];

          return (
            <div
              key={member.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-[#F8FAFC] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0F2A44] text-white flex items-center justify-center font-semibold">
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-[#1F2937]">{member.name}</p>
                  <p className="text-sm text-[#6B7280]">
                    {member.departmentName ?? "Sem departamento"}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-[#374151]">
                <Icon className="w-3.5 h-3.5" />
                {roleLabelMap[member.role]}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
