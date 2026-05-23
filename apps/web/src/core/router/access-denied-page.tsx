import { Link } from "react-router-dom";
import logo from '@/shared/assets/logos/originals/logo-symbol.png';

export function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-6">
      <div className="max-w-lg text-center bg-white border border-gray-200 rounded-3xl shadow-sm p-10">
        <div className="max-w-lg flex justify-center pb-8">
          <img className="w-12" src={logo} alt="STRATIX" />
        </div>
        <h1 className="text-3xl font-semibold text-[#1F2937] mb-3">Acesso negado</h1>
        <p className="text-[#6B7280] mb-8">
          Sua conta não possui permissão para acessar esta área no momento.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="px-5 py-3 rounded-xl bg-[#0F2A44] text-white font-medium hover:bg-[#0F2A44]/90 transition-colors"
          >
            Ir para dashboard
          </Link>
          <Link
            to="/profile"
            className="px-5 py-3 rounded-xl border border-gray-200 text-[#1F2937] font-medium hover:bg-[#F8FAFC] transition-colors"
          >
            Ver perfil
          </Link>
        </div>
      </div>
    </div>
  );
}
