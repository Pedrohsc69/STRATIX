import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../guards/protected-route';
import { PublicOnlyRoute } from '../guards/public-only-route';

import { LandingPage } from '../../modules/Landingpage/pages/landingpage-page';
import { LoginPage } from '../../modules/auth/pages/login-page';
import { RegisterPage } from '../../modules/auth/pages/register-page';
import { ForgotPasswordPage } from '../../modules/forgotPassword/pages/forgot-password-page';
import { AcceptInvitePage } from '../../modules/acceptInvite/pages/accept-invite-page';
import { RecoverPasswordPage } from "../../modules/recoverPassword/pages/recorver-password-page";

import { ProfilePage } from '../../modules/profile/pages/profile-page'
import { EmployeesPage } from "../../modules/employees/pages/employees-page";

import { DepartmentsPage } from '../../modules/department/pages/departamento-page';
import { ReportsPage } from '../../modules/reports/pages/relatorio-page';
import { SettingsPage } from '../../modules/settings/pages/settings-page';
import { DashboardPage } from '../../features/dashboard/DashboardPage';
import { OKRsPage } from '../../features/okrs/pages/OKRsPage';
import { ObjectivesPage } from '../../features/objectives/pages/ObjectivesPage';
import { StrategicCyclesPage } from '../../features/strategic-cycles/pages/StrategicCyclesPage';
import { AccessDeniedPage } from './access-denied-page';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
        <Route path="/accept-invite" element={<PublicOnlyRoute><AcceptInvitePage /></PublicOnlyRoute>} />
        <Route path="/recover-password" element={<PublicOnlyRoute><RecoverPasswordPage /></PublicOnlyRoute>} />
        
        <Route
          path="/access-denied"
          element={
            <ProtectedRoute>
              <AccessDeniedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-cycles"
          element={
            <ProtectedRoute allowedRoles={['DIRECTOR', 'MANAGER', 'EMPLOYEE']}>
              <StrategicCyclesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/objetivos"
          element={
            <ProtectedRoute allowedRoles={['DIRECTOR', 'MANAGER', 'EMPLOYEE']}>
              <ObjectivesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/okrs"
          element={
            <ProtectedRoute allowedRoles={['DIRECTOR', 'MANAGER', 'EMPLOYEE']}>
              <OKRsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departaments"
          element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path='/profile'
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route 
          path='/employees'
          element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
