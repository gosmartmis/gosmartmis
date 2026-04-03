export interface HolidayPackage {
  id: string;
  school_id: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  attachments: PackageAttachment[];
  created_at: string;
  status: 'active' | 'archived';
  views: number;
  downloads: number;
}

export interface PackageAttachment {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
}

export interface PackageView {
  package_id: string;
  student_id: string;
  viewed_at: string;
  downloaded: boolean;
  downloaded_at?: string;
}