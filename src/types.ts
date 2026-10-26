export type ScreenId =
  | 'splash'
  | 'welcome'
  | 'login'
  | 'otp'
  | 'auth_loading'
  | 'profile_setup'
  | 'auth_success'
  | 'register_passkey'
  | 'onboarding'
  | 'today'
  | 'scan'
  | 'attendance'
  | 'notifications'
  | 'profile'
  | 'settings';

export interface StudentProfile {
  name: string;
  idNumber: string;
  collegeName: string;
  department: string;
  semester: string;
  avatarUrl: string;
  email: string;
  overallAttendance: number; // e.g. 92
  cgpa: number; // e.g. 3.88
  totalCredits: number; // 114
  requiredCredits: number; // 140
  classRank: number; // 5
  totalStudentsInClass: number; // 128
  scholarshipEligible: boolean;
}

export interface Lecture {
  id: string;
  code: string;
  title: string;
  professor: string;
  professorAvatar: string;
  room: string;
  building: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: 'completed' | 'current' | 'upcoming' | 'missed';
  attendanceStatus: 'marked' | 'live' | 'missed' | 'pending';
  onlineMeetingUrl?: string;
  credits: number;
  attendancePercentage: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  dateGroup: 'TODAY' | 'YESTERDAY' | 'EARLIER THIS WEEK';
  category: 'Assignments' | 'Attendance' | 'Results' | 'System';
  isUnread: boolean;
  actionScreen?: ScreenId;
}

export interface OfflineAttendanceRecord {
  id: string;
  lectureId: string;
  lectureTitle: string;
  scannedAt: string;
  qrPayload: string;
  isSynced: boolean;
}

export interface AttendanceSessionRecord {
  sessionId: string;
  lectureId: string;
  lectureTitle: string;
  subjectCode: string;
  professor: string;
  room: string;
  scannedAtTime: string;
  status: 'PRESENT' | 'ABSENT' | 'PENDING';
  method: 'QR Code Camera' | '5-Digit OTP' | 'Manual Faculty Roll Call';
  deviceId: string;
  securityHash: string;
  locationVerified: boolean;
}
