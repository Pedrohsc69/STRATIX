type BuildPasswordResetTemplateInput = {
  companyName: string;
  resetUrl: string;
  userName?: string | null;
};

export function buildPasswordResetTemplate(input: BuildPasswordResetTemplateInput) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; color: #1F2937; background: #F5F7FA; padding: 32px;">
      <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; padding: 32px; border: 1px solid #E5E7EB;">
        <p style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #6B7280;">STRATIX</p>
        <h1 style="font-size: 28px; margin: 12px 0 16px; color: #0F2A44;">Redefinição de senha</h1>
        <p style="margin: 0 0 16px;">
          ${input.userName ? `Olá, ${input.userName}.` : 'Olá.'}
        </p>
        <p style="margin: 0 0 24px; line-height: 1.6;">
          Recebemos uma solicitação para redefinir a senha da sua conta no ambiente ${input.companyName}.
          Se foi você, use o botão abaixo para criar uma nova senha.
        </p>
        <a
          href="${input.resetUrl}"
          style="display: inline-block; background: #0F2A44; color: #FFFFFF; text-decoration: none; padding: 14px 20px; border-radius: 12px; font-weight: 600;"
        >
          Redefinir senha
        </a>
        <p style="margin: 24px 0 0; line-height: 1.6; color: #6B7280;">
          Se você não solicitou essa alteração, ignore este e-mail. O link expira automaticamente por segurança.
        </p>
      </div>
    </div>
  `.trim();
}
