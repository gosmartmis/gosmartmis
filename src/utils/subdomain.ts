/**
 * Multi-Tenant Subdomain Detection and Management
 * Handles subdomain routing for Go Smart M.I.S platform
 * @version 2.0
 */

import { supabase } from '../lib/supabase';

export interface SubdomainInfo {
  subdomain: string | null;
  isMainPlatform: boolean;
  isSuperAdmin: boolean;
  isDemo: boolean;
  isSchool: boolean;
  schoolSlug: string | null;
  fullDomain: string;
}

export interface SchoolRecord {
  id: string;
  name: string;
  slug: string;
  subscription_status: 'active' | 'trial' | 'expired' | 'suspended';
  subscription_expiry: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  primary_color: string | null;
  secondary_color: string | null;
}

export interface SchoolFetchResult {
  school: SchoolRecord | null;
  error: 'not_found' | 'inactive' | null;
}

/**
 * Extract subdomain from current hostname
 * Examples:
 * - gosmartmis.rw → null (main platform)
 * - admin.gosmartmis.rw → 'admin'
 * - elite.gosmartmis.rw → 'elite'
 * - localhost:3000 → null (development)
 */
export function getSubdomainInfo(): SubdomainInfo {
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Development environment handling
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check for subdomain simulation in development using query params
    const urlParams = new URLSearchParams(window.location.search);
    const devSubdomain = urlParams.get('subdomain');
    
    if (devSubdomain === 'admin') {
      return {
        subdomain: 'admin',
        isMainPlatform: false,
        isSuperAdmin: true,
        isDemo: false,
        isSchool: false,
        schoolSlug: null,
        fullDomain: `localhost:${port}`
      };
    }

    if (devSubdomain === 'demo') {
      return {
        subdomain: 'demo',
        isMainPlatform: false,
        isSuperAdmin: false,
        isDemo: true,
        isSchool: false,
        schoolSlug: null,
        fullDomain: `localhost:${port}`
      };
    }
    
    if (devSubdomain && devSubdomain !== 'admin') {
      return {
        subdomain: devSubdomain,
        isMainPlatform: false,
        isSuperAdmin: false,
        isDemo: false,
        isSchool: true,
        schoolSlug: devSubdomain,
        fullDomain: `localhost:${port}`
      };
    }
    
    return {
      subdomain: null,
      isMainPlatform: true,
      isSuperAdmin: false,
      isDemo: false,
      isSchool: false,
      schoolSlug: null,
      fullDomain: `localhost:${port}`
    };
  }
  
  // Production environment
  const parts = hostname.split('.');

  // Detect hosted platform domains where the app itself has 3 parts
  // e.g. gosmartmis.readdy.co / gosmartmis.readdy.ai / gosmartmis.vercel.app / gosmartmis.netlify.app
  const isThirdPartyHost = (
    hostname.endsWith('.readdy.co') ||
    hostname.endsWith('.readdy.ai') ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.netlify.app')
  );

  // For third-party hosts the "main platform" occupies 3 parts (e.g. gosmartmis.readdy.co)
  // and school subdomains would need 4+ parts (schoolname.gosmartmis.readdy.co).
  // For custom domains the "main platform" occupies 2 parts (e.g. gosmartmis.rw).
  const mainPlatformPartCount = isThirdPartyHost ? 3 : 2;

  // Main platform
  if (parts.length <= mainPlatformPartCount) {
    return {
      subdomain: null,
      isMainPlatform: true,
      isSuperAdmin: false,
      isDemo: false,
      isSchool: false,
      schoolSlug: null,
      fullDomain: hostname
    };
  }
  
  // Subdomain exists
  if (parts.length > mainPlatformPartCount) {
    const subdomain = parts[0];
    
    // Super admin panel
    if (subdomain === 'admin') {
      return {
        subdomain: 'admin',
        isMainPlatform: false,
        isSuperAdmin: true,
        isDemo: false,
        isSchool: false,
        schoolSlug: null,
        fullDomain: hostname
      };
    }

    // Demo subdomain
    if (subdomain === 'demo') {
      return {
        subdomain: 'demo',
        isMainPlatform: false,
        isSuperAdmin: false,
        isDemo: true,
        isSchool: false,
        schoolSlug: null,
        fullDomain: hostname
      };
    }

    // www.gosmartmis.rw — treat as main platform
    if (subdomain === 'www') {
      return {
        subdomain: null,
        isMainPlatform: true,
        isSuperAdmin: false,
        isDemo: false,
        isSchool: false,
        schoolSlug: null,
        fullDomain: hostname
      };
    }
    
    // School subdomain
    return {
      subdomain,
      isMainPlatform: false,
      isSuperAdmin: false,
      isDemo: false,
      isSchool: true,
      schoolSlug: subdomain,
      fullDomain: hostname
    };
  }
  
  // Fallback to main platform
  return {
    subdomain: null,
    isMainPlatform: true,
    isSuperAdmin: false,
    isDemo: false,
    isSchool: false,
    schoolSlug: null,
    fullDomain: hostname
  };
}

/**
 * Fetch school record from Supabase by slug
 * Returns school data or error state
 */
export async function fetchSchoolBySlug(slug: string): Promise<SchoolFetchResult> {
  if (!slug || slug === 'admin') {
    return { school: null, error: 'not_found' };
  }

  try {
    const { data: school, error } = await supabase
      .from('schools')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching school by slug:', error);
      return { school: null, error: 'not_found' };
    }

    if (!school) {
      return { school: null, error: 'not_found' };
    }

    // Check if school is inactive or suspended
    if (school.subscription_status === 'suspended') {
      return { school: school as SchoolRecord, error: 'inactive' };
    }

    return { school: school as SchoolRecord, error: null };
  } catch (err) {
    console.error('Exception fetching school:', err);
    return { school: null, error: 'not_found' };
  }
}

/**
 * Get school ID from subdomain (deprecated - use fetchSchoolBySlug instead)
 * Kept for backward compatibility
 */
export function getSchoolIdFromSubdomain(subdomain: string): string | null {
  if (!subdomain || subdomain === 'admin') {
    return null;
  }
  
  // Mock school IDs - in production, query database
  const schoolMap: Record<string, string> = {
    'elite': 'school_001',
    'future': 'school_002',
    'bright': 'school_003',
    'smart': 'school_004',
    'excellence': 'school_005'
  };
  
  return schoolMap[subdomain] || `school_${subdomain}`;
}

/**
 * Store school context in session
 */
export function setSchoolContext(schoolId: string, schoolName: string, subdomain: string): void {
  sessionStorage.setItem('school_id', schoolId);
  sessionStorage.setItem('school_name', schoolName);
  sessionStorage.setItem('school_subdomain', subdomain);
}

/**
 * Get current school context
 */
export function getSchoolContext(): {
  schoolId: string | null;
  schoolName: string | null;
  subdomain: string | null;
} {
  return {
    schoolId: sessionStorage.getItem('school_id'),
    schoolName: sessionStorage.getItem('school_name'),
    subdomain: sessionStorage.getItem('school_subdomain')
  };
}

/**
 * Clear school context on logout
 */
export function clearSchoolContext(): void {
  sessionStorage.removeItem('school_id');
  sessionStorage.removeItem('school_name');
  sessionStorage.removeItem('school_subdomain');
  sessionStorage.removeItem('user_role');
  sessionStorage.removeItem('user_email');
  sessionStorage.removeItem('tenant_school_id');
}

/**
 * Get the base domain (handles both custom domains and third-party hosting)
 * gosmartmis.rw → gosmartmis.rw
 * gosmartmis.readdy.co → gosmartmis.readdy.co
 * school.gosmartmis.readdy.co → gosmartmis.readdy.co
 */
function getBaseDomain(): string {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return hostname;

  const isThirdPartyHost = (
    hostname.endsWith('.readdy.co') ||
    hostname.endsWith('.readdy.ai') ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.netlify.app')
  );

  const parts = hostname.split('.');
  // Third-party host: base is last 3 parts; custom domain: last 2 parts
  const baseParts = isThirdPartyHost ? parts.slice(-3) : parts.slice(-2);
  return baseParts.join('.');
}

/**
 * Redirect to appropriate subdomain
 */
export function redirectToSubdomain(subdomain: string, path: string = '/'): void {
  const currentHostname = window.location.hostname;
  
  // Development environment
  if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
    const port = window.location.port;
    window.location.href = `http://localhost:${port}${path}?subdomain=${subdomain}`;
    return;
  }
  
  // Production environment
  const baseDomain = getBaseDomain();
  const newUrl = `https://${subdomain}.${baseDomain}${path}`;
  window.location.href = newUrl;
}

/**
 * Check if user has access to current subdomain
 */
export function validateSubdomainAccess(userSchoolId: string | null, currentSchoolId: string | null): boolean {
  // Super admin can access any subdomain
  const userRole = sessionStorage.getItem('user_role');
  if (userRole === 'super-admin') {
    return true;
  }
  
  // Regular users must match school_id
  if (!userSchoolId || !currentSchoolId) {
    return false;
  }
  
  return userSchoolId === currentSchoolId;
}

/**
 * Get platform base URL
 */
export function getPlatformBaseUrl(): string {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const port = window.location.port;
    return `http://localhost:${port}`;
  }
  
  return `https://${getBaseDomain()}`;
}

/**
 * Get super admin URL
 */
export function getSuperAdminUrl(): string {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const port = window.location.port;
    return `http://localhost:${port}?subdomain=admin`;
  }
  
  return `https://admin.${getBaseDomain()}`;
}

/**
 * Get school URL
 */
export function getSchoolUrl(schoolSlug: string): string {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const port = window.location.port;
    return `http://localhost:${port}?subdomain=${schoolSlug}`;
  }
  
  return `https://${schoolSlug}.${getBaseDomain()}`;
}