import { lazy, Suspense } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { getSubdomainInfo } from '../utils/subdomain';

const HomePage = lazy(() => import('./home/page'));
const SchoolLandingPage = lazy(() => import('./school-landing/page'));
const DemoPortalPage = lazy(() => import('./demo/page'));

/**
 * Smart index router:
 * - demo.gosmartmis.rw → DemoPortalPage
 * - School subdomain (e.g. elite.gosmartmis.rw) → SchoolLandingPage
 * - Main platform (gosmartmis.rw) → HomePage
 */
export default function SmartIndex() {
  const { isLoading } = useTenant();
  const subdomainInfo = getSubdomainInfo();

  if (subdomainInfo.isDemo) {
    return (
      <Suspense fallback={null}>
        <DemoPortalPage />
      </Suspense>
    );
  }

  if (isLoading && subdomainInfo.isSchool) {
    return null;
  }

  if (subdomainInfo.isSchool) {
    return (
      <Suspense fallback={null}>
        <SchoolLandingPage />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={null}>
      <HomePage />
    </Suspense>
  );
}
