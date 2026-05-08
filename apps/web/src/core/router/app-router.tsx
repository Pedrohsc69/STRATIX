import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthGuard } from '../guards/auth-guard';

import { LandingPage } from '../../modules/Landingpage/pages/landingpage-page';
import { LoginPage } from '../../modules/auth/pages/login-page';
import { RegisterPage } from '../../modules/auth/pages/register-page';
import { ForgotPasswordPage } from '../../modules/forgotPassword/pages/forgot-password-page';
import { AcceptInvitePage } from '../../modules/acceptInvite/pages/accept-invite-page';
import { RecoverPasswordPage } from "../../modules/recoverPassword/pages/recorver-password-page";

import { DashboardDirectorPage } from '../../modules/dashboardDirector/pages/dashboard-director-page';
import { DashboardManagerPage } from '../../modules/dashboardManager/pages/dashboard-manager-page';

import { ProfilePage } from '../../modules/profile/pages/profile-page'

import { Departments } from '../../modules/department/pages/departamento-page';
import { ObjetivoPage } from '../../modules/objective/pages/objetivo-page';
import { OkrPage } from '../../modules/okr/pages/okr-page';
import { RelatorioPage } from '../../modules/relatorio/pages/relatorio-page';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/recover-password" element={<RecoverPasswordPage />} />
        

        <Route
          path="/dashboard-director"
          element={
            <AuthGuard>
              <DashboardDirectorPage />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard-manager"
          element={
            <AuthGuard>
              <DashboardManagerPage />
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
          path="/departaments"
          element={
            <AuthGuard>
              <Departments />
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
        <Route 
          path='/profile'
          element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
