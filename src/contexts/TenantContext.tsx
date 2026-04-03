import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchSchoolBySlug, getSubdomainInfo } from '../utils/subdomain';

interface SchoolRecord {
  id: string;
  name: string;
  slug: string;
  subscription_status: string;
  subscription_expiry: string | null;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  contact_email?: string;
  student_limit?: number;
  disabled_modules?: string[];
  primary_color?: string;
  secondary_color?: string;
}

interface TenantContextType {
  schoolId: string | null;
  schoolSlug: string | null;
  schoolRecord: SchoolRecord | null;
  tenantError: 'not_found' | 'inactive' | null;
  isLoading: boolean;
  setSchoolContext: (id: string, name: string, slug: string) => void;
  clearSchoolContext: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolSlug, setSchoolSlug] = useState<string | null>(null);
  const [schoolRecord, setSchoolRecord] = useState<SchoolRecord | null>(null);
  const [tenantError, setTenantError] = useState<'not_found' | 'inactive' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTenant = async () => {
      setIsLoading(true);
      setTenantError(null);

      const subdomainInfo = getSubdomainInfo();
      const slug = subdomainInfo.schoolSlug;

      // No school subdomain — main domain, super-admin, or localhost
      // Resolve immediately without any Supabase call
      if (!slug) {
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cachedSchoolId = sessionStorage.getItem('tenant_school_id');
      const cachedSchoolSlug = sessionStorage.getItem('tenant_school_slug');
      const cachedSchoolRecord = sessionStorage.getItem('tenant_school_record');

      if (cachedSchoolId && cachedSchoolSlug && cachedSchoolRecord) {
        try {
          const parsedRecord = JSON.parse(cachedSchoolRecord);
          setSchoolId(cachedSchoolId);
          setSchoolSlug(cachedSchoolSlug);
          setSchoolRecord(parsedRecord);
          setIsLoading(false);
          return;
        } catch {
          sessionStorage.removeItem('tenant_school_id');
          sessionStorage.removeItem('tenant_school_slug');
          sessionStorage.removeItem('tenant_school_record');
        }
      }

      // Fetch school record from Supabase
      const result = await fetchSchoolBySlug(slug);

      if (result.error === 'not_found') {
        setTenantError('not_found');
        setIsLoading(false);
        return;
      }

      if (result.error === 'inactive') {
        setTenantError('inactive');
        setSchoolRecord(result.school as SchoolRecord);
        setIsLoading(false);
        return;
      }

      if (!result.school) {
        setTenantError('not_found');
        setIsLoading(false);
        return;
      }

      const school = result.school;
      setSchoolId(school.id);
      setSchoolSlug(school.slug);
      setSchoolRecord(school as SchoolRecord);

      sessionStorage.setItem('tenant_school_id', school.id);
      sessionStorage.setItem('tenant_school_slug', school.slug);
      sessionStorage.setItem('tenant_school_record', JSON.stringify(school));

      setIsLoading(false);
    };

    initializeTenant();
  }, []);

  const setSchoolContext = (id: string, name: string, slug: string) => {
    setSchoolId(id);
    setSchoolSlug(slug);

    const record: SchoolRecord = {
      id,
      name,
      slug,
      subscription_status: 'active',
      subscription_expiry: null,
    };

    setSchoolRecord(record);

    sessionStorage.setItem('tenant_school_id', id);
    sessionStorage.setItem('tenant_school_slug', slug);
    sessionStorage.setItem('tenant_school_record', JSON.stringify(record));
  };

  const clearSchoolContext = () => {
    setSchoolId(null);
    setSchoolSlug(null);
    setSchoolRecord(null);
    setTenantError(null);
    sessionStorage.removeItem('tenant_school_id');
    sessionStorage.removeItem('tenant_school_slug');
    sessionStorage.removeItem('tenant_school_record');
  };

  return (
    <TenantContext.Provider
      value={{
        schoolId,
        schoolSlug,
        schoolRecord,
        tenantError,
        isLoading,
        setSchoolContext,
        clearSchoolContext,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
