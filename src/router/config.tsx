import React from 'react';
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import SubdomainRouter from './SubdomainRouter';
import ProtectedRoute from './ProtectedRoute';
import SmartIndex from '../pages/SmartIndex';

const LoginPage = lazy(() => import('../pages/login/page'));
const RegisterPage = lazy(() => import('../pages/register/page'));
const SuperAdminPage = lazy(() => import('../pages/super-admin/page'));
const DirectorPage = lazy(() => import('../pages/director/page'));
const TeacherPage = lazy(() => import('../pages/teacher/page'));
const StudentPage = lazy(() => import('../pages/student/page'));
const DeanPage = lazy(() => import('../pages/dean/page'));
const RegistrarPage = lazy(() => import('../pages/registrar/page'));
const AccountantPage = lazy(() => import('../pages/accountant/page'));
const ForgotPasswordPage = lazy(() => import('../pages/forgot-password/page'));
const NotFound = lazy(() => import('../pages/NotFound'));
const SchoolManagerPage = lazy(() => import('../pages/school-manager/page'));
const SetupPage = lazy(() => import('../pages/setup/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <SubdomainRouter />,
    children: [
      {
        index: true,
        // SmartIndex: school subdomain → SchoolLandingPage, main domain → HomePage
        element: <SmartIndex />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'setup',
        element: <SetupPage />,
      },
      {
        path: 'super-admin',
        element: (
          <ProtectedRoute allowedRoles={['super-admin']}>
            <SuperAdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'director',
        element: (
          <ProtectedRoute allowedRoles={['director']}>
            <DirectorPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dean',
        element: (
          <ProtectedRoute allowedRoles={['dean']}>
            <DeanPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'registrar',
        element: (
          <ProtectedRoute allowedRoles={['registrar']}>
            <RegistrarPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'accountant',
        element: (
          <ProtectedRoute allowedRoles={['accountant']}>
            <AccountantPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher',
        element: (
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'student',
        element: (
          <ProtectedRoute allowedRoles={['student']}>
            <StudentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'school-manager',
        element: (
          <ProtectedRoute allowedRoles={['school-manager']}>
            <SchoolManagerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];

export default routes;