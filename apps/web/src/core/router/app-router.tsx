import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthGuard } from '../guards/auth-guard';
import { Home } from '../../modules/home/pages/home-page';
import { RegisterPage } from '../../modules/auth/pages/register-page';
import { AcceptInvitePage } from '../../modules/acceptInvite/pages/accept-invite-page';
import { DashboardGeneralPage } from '../../modules/dashboardGeneral/pages/dashboard-general-page';
import { DashboardDepartamentPage } from '../../modules/dashboardDepartment/pages/dashboard-departament-page';
import { DepartamentoPage } from '../../modules/department/pages/departamento-page';
import { LoginPage } from '../../modules/auth/pages/login-page';
import { ObjetivoPage } from '../../modules/objective/pages/objetivo-page';
import { OkrPage } from '../../modules/okr/pages/okr-page';
import { RelatorioPage } from '../../modules/relatorio/pages/relatorio-page';
import { RecoverPasswordPage } from '../../modules/recoverPassword/pages/recover-password-page';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/recover-password" element={<RecoverPasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />

        <Route
          path="/dashboard-general"
          element={
            <AuthGuard>
              <DashboardGeneralPage />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard-departament"
          element={
            <AuthGuard>
              <DashboardDepartamentPage />
            </AuthGuard>
          }
        />
        <Route
          path="/objetivos"
          element={
            <AuthGuard>
              <ObjetivoPage />
            </AuthGuard>
          }
        />
        <Route
          path="/okrs"
          element={
            <AuthGuard>
              <OkrPage />
            </AuthGuard>
          }
        />
        <Route
          path="/departamentos"
          element={
            <AuthGuard>
              <DepartamentoPage />
            </AuthGuard>
          }
        />
        <Route
          path="/relatorios"
          element={
            <AuthGuard>
              <RelatorioPage />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
