// TranscriptCheck — Centralised TypeScript Type Definitions
// Unit 3 Section 3.3.2 (Linguistic Notation) +
// Unit 3 Section 3.4.4 (Design by Contract)
 
export type UserRole = 'student' | 'admin';
 
export interface Faculty {
  id: string;
  name: string;
  code: string;
}
 
export interface Department {
  id: string;
  name: string;
  code: string;
  faculty_id: string;
}
 
export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  matricule: string | null;
  faculty: string | null;
  department: string | null;
  created_at: string;
}

export type TranscriptStatus =
  | 'pending'
  | 'flagged'
  | 'confirmed';
 
export type AnomalySeverity = 'low' | 'medium' | 'high';
 
export interface AnomalyResult {
  type: string;
  description: string;
  severity: AnomalySeverity;
  detected_value?: string;
  expected_range?: string;
}
 
export interface Transcript {
  id: string;
  student_id: string;
  file_path: string;
  file_name: string;
  academic_year: string;
  status: TranscriptStatus;
  ai_anomalies: AnomalyResult[];
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
}
 
export type FlagStatus =
  | 'pending'
  | 'under_review'
  | 'resolved'
  | 'rejected';
 
export interface Flag {
  id: string;
  transcript_id: string;
  student_id: string;
  error_type: string;
  wrong_value: string;
  correct_value: string;
  description: string;
  status: FlagStatus;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
}
 
export interface StudentRegistrationForm {
  full_name: string;
  email: string;
  matricule: string;
  faculty_id: string;
  department_id: string;
  password: string;
  confirm_password: string;
}
 
export interface AdminRegistrationForm {
  full_name: string;
  email: string;
  faculty_id: string;
  password: string;
  confirm_password: string;
}
 
export interface FlagForm {
  transcript_id: string;
  error_type: string;
  wrong_value: string;
  correct_value: string;
  description: string;
}
 
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}
 
export interface ApiError {
  success: false;
  error: string;
  details?: string;
}
 
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
