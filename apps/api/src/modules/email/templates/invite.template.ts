import { UserRole } from '@prisma/client';

type InviteTemplateInput = {
  acceptUrl: string;
  companyName: string;
  departmentName: string | null;
  inviteeName?: string | null;
  role: UserRole;
};

function getRoleLabel(role: UserRole) {
  switch (role) {
    case UserRole.MANAGER:
      return 'Gestor';
    case UserRole.EMPLOYEE:
      return 'Colaborador';
    default:
      return role;
  }
}

export function buildInviteTemplate(input: InviteTemplateInput) {
  const inviteeSection = input.inviteeName
    ? `<p style="margin:0 0 24px;color:#1e293b;font-size:16px;">Olá, <strong>${input.inviteeName}</strong>.</p>`
    : '';

  const departmentSection = input.departmentName
    ? `<tr>
        <td style="padding:0 0 12px;color:#64748b;font-size:14px;">Departamento</td>
        <td style="padding:0 0 12px;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${input.departmentName}</td>
      </tr>`
    : '';

  const roleLabel = getRoleLabel(input.role);

  return `
    <div style="background:#f8fafc;padding:32px 16px;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #dbe4f0;">
        <div style="background:linear-gradient(135deg,#0b3b73 0%,#1556a6 100%);padding:32px;color:#ffffff;">
          <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">STRATIX</div>
          <h1 style="margin:12px 0 8px;font-size:28px;line-height:1.2;">Convite para acessar a plataforma</h1>
          <p style="margin:0;font-size:15px;opacity:0.9;">Ative sua conta com segurança e conclua o acesso ao ambiente estratégico da sua empresa.</p>
        </div>

        <div style="padding:32px;">
          ${inviteeSection}
          <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
            Você recebeu um convite para acessar a STRATIX em nome de <strong>${input.companyName}</strong>.
          </p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:0 0 12px;color:#64748b;font-size:14px;">Empresa</td>
                <td style="padding:0 0 12px;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${input.companyName}</td>
              </tr>
              ${departmentSection}
              <tr>
                <td style="padding:0;color:#64748b;font-size:14px;">Cargo atribuído</td>
                <td style="padding:0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${roleLabel}</td>
              </tr>
            </table>
          </div>

          <a
            href="${input.acceptUrl}"
            style="display:inline-block;background:#1556a6;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-weight:600;font-size:15px;"
          >
            Aceitar convite
          </a>

          <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
            Se você não esperava este convite, ignore este email. Por segurança, o link possui validade limitada.
          </p>
        </div>
      </div>
    </div>
  `;
}
