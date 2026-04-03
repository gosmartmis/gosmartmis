import { useState } from 'react';
import { supabase, getAuthToken } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';
import { useAuth } from '../../../hooks/useAuth';
import { useClasses } from '../../../hooks/useClasses';
import { useAcademicYears } from '../../../hooks/useAcademicYears';
import CsvImportModal from './CsvImportModal';
import { notifyStudentEnrolled } from '../../../utils/notificationService';

interface AccountResult {
  registration_number: string;
  temp_password: string;
  login_credential: string;
}

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;

export default function StudentRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [createAccount, setCreateAccount] = useState(true);
  const [accountResult, setAccountResult] = useState<AccountResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { schoolRecord } = useTenant();
  const { profile } = useAuth();

  const resolvedSchoolId: string | null = schoolRecord?.id ?? profile?.school_id ?? null;
  const schoolInfo = resolvedSchoolId ? { id: resolvedSchoolId, name: schoolRecord?.name ?? '' } : null;
  const schoolSlug: string = schoolRecord?.slug ?? sessionStorage.getItem('tenant_school_slug') ?? '';

  const { classes } = useClasses(resolvedSchoolId);
  const { academicYears } = useAcademicYears(resolvedSchoolId);

  const emptyForm = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    nationalId: '',
    bloodGroup: '',
    address: '',
    guardianName: '',
    relationship: '',
    guardianPhone: '',
    guardianEmail: '',
    occupation: '',
    academicYearId: '',
    classId: '',
    previousSchool: '',
    admissionDate: new Date().toISOString().split('T')[0],
  };

  const [formData, setFormData] = useState(emptyForm);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleReset = () => {
    setFormData(emptyForm);
    setCurrentStep(1);
    setSuccess(false);
    setAccountResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!schoolInfo?.id) {
      setError('School information not found. Please refresh and try again.');
      return;
    }
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender) {
      setError('Please fill in all required personal information');
      return;
    }
    if (!formData.guardianName || !formData.guardianPhone) {
      setError('Please fill in required guardian information');
      return;
    }
    if (!formData.classId || !formData.admissionDate) {
      setError('Please fill in required academic information');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      // 1. Insert student record
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          school_id: schoolInfo.id,
          full_name: fullName,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          national_id: formData.nationalId || null,
          blood_group: formData.bloodGroup || null,
          address: formData.address || null,
          parent_name: formData.guardianName,
          parent_phone: formData.guardianPhone,
          parent_email: formData.guardianEmail || null,
          class_id: formData.classId,
          previous_school: formData.previousSchool || null,
          enrollment_date: formData.admissionDate,
          status: 'active',
        });

      if (insertError) throw insertError;

      // Fire notification
      const resolvedClass = classes?.find((c) => c.id === formData.classId);
      notifyStudentEnrolled(schoolInfo.id, fullName, resolvedClass?.name || '');

      // 2. Optionally create login account
      if (createAccount) {
        const token = await getAuthToken();

        const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-school-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'create',
            school_id: schoolInfo.id,
            school_name: schoolInfo.name,
            school_slug: schoolSlug,
            director_name: fullName,
            target_role: 'student',
          }),
        });

        const json = await res.json();

        if (!res.ok || json.error) {
          // Account creation failed but student record was saved — show partial success
          setError(`Student registered, but account creation failed: ${json.error ?? 'Unknown error'}. You can create their account later via User Management.`);
        } else if (json.registration_number) {
          setAccountResult({
            registration_number: json.registration_number,
            temp_password: json.temp_password ?? '',
            login_credential: json.login_credential ?? json.registration_number,
          });
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Error registering student:', err);
      setError(err?.message ?? 'Failed to register student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: 'ri-user-line' },
    { number: 2, title: 'Guardian Info', icon: 'ri-parent-line' },
    { number: 3, title: 'Academic Info', icon: 'ri-book-line' },
    { number: 4, title: 'Documents', icon: 'ri-file-list-line' },
  ];

  // ── Success screen ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Student Registration</h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">Register new students to the school</p>
        </div>

        {/* Partial error (student saved, account failed) */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <i className="ri-error-warning-line text-xl text-amber-600 mt-0.5"></i>
            <div>
              <p className="font-semibold text-amber-900 text-sm">Partial Success</p>
              <p className="text-sm text-amber-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Main success card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 flex items-center justify-center bg-emerald-100 rounded-full mb-4">
              <i className="ri-checkbox-circle-line text-3xl text-emerald-600"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {formData.firstName} {formData.lastName} registered!
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Student record has been created successfully
              {accountResult ? ' with login credentials.' : '.'}
            </p>
          </div>

          {/* Credentials block */}
          {accountResult && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 flex items-center justify-center bg-teal-100 rounded-lg">
                  <i className="ri-shield-keyhole-line text-sm text-teal-600"></i>
                </div>
                <h4 className="font-bold text-gray-900">Login Credentials</h4>
                <span className="ml-auto text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                  Save these now — shown once
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
                {/* Registration number */}
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Registration Number / Login ID</p>
                    <p className="font-mono font-bold text-gray-900 text-lg mt-0.5">{accountResult.registration_number}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(accountResult.registration_number, 'reg')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className={`${copiedField === 'reg' ? 'ri-check-line text-emerald-600' : 'ri-file-copy-line'} text-sm`}></i>
                    {copiedField === 'reg' ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Temp password */}
                {accountResult.temp_password && (
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Temporary Password</p>
                      <p className="font-mono font-bold text-gray-900 text-lg mt-0.5">{accountResult.temp_password}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(accountResult.temp_password, 'pw')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className={`${copiedField === 'pw' ? 'ri-check-line text-emerald-600' : 'ri-file-copy-line'} text-sm`}></i>
                      {copiedField === 'pw' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}

                {/* Copy all */}
                <div className="px-4 py-3">
                  <button
                    onClick={() => copyToClipboard(
                      `Login ID: ${accountResult.registration_number}\nPassword: ${accountResult.temp_password}`,
                      'all'
                    )}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-sm font-semibold hover:bg-teal-100 transition-colors cursor-pointer"
                  >
                    <i className={`${copiedField === 'all' ? 'ri-check-line' : 'ri-file-copy-2-line'} text-sm`}></i>
                    {copiedField === 'all' ? 'Copied to clipboard!' : 'Copy both credentials'}
                  </button>
                </div>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-3">
                <i className="ri-information-line text-sm"></i>
                The student must change this password on their first login.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <i className="ri-user-add-line"></i>
              Register Another Student
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <i className="ri-file-upload-line"></i>
              Bulk Import
            </button>
          </div>
        </div>

        {showImport && schoolInfo?.id && (
          <CsvImportModal
            schoolId={schoolInfo.id}
            defaultTab="students"
            onClose={() => setShowImport(false)}
            onImported={() => {}}
          />
        )}
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Student Registration</h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">Register new students to the school</p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors text-sm font-semibold cursor-pointer whitespace-nowrap"
        >
          <i className="ri-file-upload-line text-base"></i>
          Bulk Import CSV
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <i className="ri-error-warning-line text-xl text-red-600 mt-0.5"></i>
          <div>
            <p className="font-semibold text-red-900 text-sm">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep >= step.number
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <i className={`${step.icon} text-xl`}></i>
                </div>
                <span className={`text-xs md:text-sm font-semibold mt-2 text-center ${
                  currentStep >= step.number ? 'text-teal-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                  currentStep > step.number ? 'bg-gradient-to-r from-teal-500 to-emerald-500' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">

        {/* ── Step 1: Personal Info ── */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                <input type="text" placeholder="Enter first name" value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                <input type="text" placeholder="Enter last name" value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth *</label>
                <input type="date" value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
                <select value={formData.gender} onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">National ID</label>
                <input type="text" placeholder="Enter national ID" value={formData.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group</label>
                <select value={formData.bloodGroup} onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm">
                  <option value="">Select Blood Group</option>
                  {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <textarea rows={3} placeholder="Enter full address" value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none text-sm" />
            </div>
          </div>
        )}

        {/* ── Step 2: Guardian Info ── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Guardian Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Guardian Name *</label>
                <input type="text" placeholder="Enter guardian name" value={formData.guardianName}
                  onChange={(e) => handleInputChange('guardianName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
                <select value={formData.relationship} onChange={(e) => handleInputChange('relationship', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm">
                  <option value="">Select Relationship</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <input type="tel" placeholder="+250 XXX XXX XXX" value={formData.guardianPhone}
                  onChange={(e) => handleInputChange('guardianPhone', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" placeholder="guardian@example.com" value={formData.guardianEmail}
                  onChange={(e) => handleInputChange('guardianEmail', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Occupation</label>
              <input type="text" placeholder="Enter occupation" value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm" />
            </div>
          </div>
        )}

        {/* ── Step 3: Academic Info + Account Toggle ── */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year</label>
                <select value={formData.academicYearId} onChange={(e) => handleInputChange('academicYearId', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm">
                  <option value="">Select Year</option>
                  {academicYears?.map((year) => (
                    <option key={year.id} value={year.id}>{year.year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class *</label>
                <select value={formData.classId} onChange={(e) => handleInputChange('classId', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm">
                  <option value="">Select Class</option>
                  {classes?.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Previous School</label>
                <input type="text" placeholder="Enter previous school name" value={formData.previousSchool}
                  onChange={(e) => handleInputChange('previousSchool', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Admission Date *</label>
                <input type="date" value={formData.admissionDate}
                  onChange={(e) => handleInputChange('admissionDate', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm" />
              </div>
            </div>

            {/* ── Create Account Toggle ── */}
            <div className={`mt-2 rounded-xl border-2 p-4 transition-colors ${createAccount ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${createAccount ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    <i className={`ri-shield-user-line text-xl ${createAccount ? 'text-emerald-600' : 'text-gray-400'}`}></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Create System Account</p>
                    <p className="text-xs text-gray-500 mt-0.5">Generate login credentials for this student</p>
                  </div>
                </div>
                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => setCreateAccount(!createAccount)}
                  className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors cursor-pointer focus:outline-none ${createAccount ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${createAccount ? 'translate-x-6' : 'translate-x-0'}`}></span>
                </button>
              </div>
              {createAccount && (
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-800">
                      <i className="ri-id-card-line"></i>
                      Registration number auto-generated as login ID
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-800">
                      <i className="ri-key-line"></i>
                      Temporary password generated
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-800">
                      <i className="ri-refresh-line"></i>
                      Student must change password on first login
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 mt-2 flex items-center gap-1.5">
                    <i className="ri-information-line"></i>
                    Requires a registration number prefix to be configured in Registration Settings.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 4: Documents ── */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Required Documents</h3>
            <p className="text-sm text-gray-500">Upload supporting documents (optional — can be added later).</p>
            <div className="space-y-3">
              {['Birth Certificate', 'Previous School Report', 'Passport Photo'].map((doc) => (
                <div key={doc} className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-teal-400 transition-colors cursor-pointer">
                  <i className="ri-upload-cloud-line text-3xl text-gray-300 mb-1"></i>
                  <p className="text-sm font-semibold text-gray-700">{doc}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Click to upload or drag and drop</p>
                </div>
              ))}
            </div>

            {/* Summary before submit */}
            <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-1.5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Registration Summary</p>
              <p className="text-sm text-gray-700"><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</p>
              <p className="text-sm text-gray-700"><span className="font-medium">Gender:</span> {formData.gender}</p>
              <p className="text-sm text-gray-700"><span className="font-medium">Guardian:</span> {formData.guardianName} · {formData.guardianPhone}</p>
              <p className="text-sm text-gray-700"><span className="font-medium">Class:</span> {classes?.find((c) => c.id === formData.classId)?.name || '—'}</p>
              <p className="text-sm text-gray-700"><span className="font-medium">Admission Date:</span> {formData.admissionDate}</p>
              <div className="flex items-center gap-1.5 pt-1">
                <i className={`${createAccount ? 'ri-checkbox-circle-fill text-emerald-500' : 'ri-close-circle-line text-gray-400'} text-sm`}></i>
                <p className={`text-sm font-medium ${createAccount ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {createAccount ? 'System login account will be created' : 'No login account (enroll only)'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || loading}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            <i className="ri-arrow-left-line mr-2"></i>Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all whitespace-nowrap disabled:opacity-40 cursor-pointer"
            >
              Next<i className="ri-arrow-right-line ml-2"></i>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all whitespace-nowrap disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Registering...</>
              ) : (
                <><i className="ri-user-add-line"></i>Complete Registration</>
              )}
            </button>
          )}
        </div>
      </div>

      {showImport && schoolInfo?.id && (
        <CsvImportModal
          schoolId={schoolInfo.id}
          defaultTab="students"
          onClose={() => setShowImport(false)}
          onImported={() => {}}
        />
      )}
    </div>
  );
}
