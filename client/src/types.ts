export type UserRole = "admin" | "teacher" | "student" | "parent";

export interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface RootState {
  auth: {
    user: User | null;
  };
}

export interface ServerError {
  status?: number;
  data?: {
    message?: string;
  };
  message?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  studentClass?: Class;
  teacherSubjects?: Subject[];
}

export interface AcademicYear {
  _id: string;
  name: string; // "2024-2025"
  fromYear: Date; // "2024-09-01"
  toYear: Date; // "2025-06-30"
  isCurrent: boolean; // true/false
}

export interface Class {
  _id: string;
  name: string; // e.g., "Grade 10"
  academicYear: AcademicYear; // Link to "2024-2025"
  classTeacher: User; // The main teacher in charge
  subjects: Subject[]; // List of subjects taught in this class
  students: User[]; // List of students enrolled
  capacity: number; // Max students allowed (optional)
}

export interface Subject {
  _id: string;
  name: string; // "Mathematics"
  code: string; // "MATH101"
  teacher?: User[]; // Default teacher for this subject
  isActive: boolean; // Indicates if the subject is currently active
}

export interface Question {
  _id: string;
  questionText: string;
  type: string;
  options: string[]; // Array of strings e.g. ["A", "B", "C", "D"]
  correctAnswer: string; // Hidden from students in default queries
  points: number;
}

export interface Exam {
  _id: string;
  title: string;
  subject: Subject;
  class: Class;
  teacher: User;
  duration: number; // in minutes
  questions: Question[];
  dueDate: Date;
  isActive: boolean;
}

export interface Submission {
  _id: string;
  score: number;
  exam: Exam; // The populated exam with answers
  answers: { questionId: string; answer: string }[];
}

export interface Period {
  _id: string;
  subject: { _id: string; name: string; code: string };
  teacher: { _id: string; name: string };
  startTime: string; // e.g., "08:00"
  endTime: string; // e.g., "08:45"
}

export interface schedule {
  day: string; // "Monday", "Tuesday", etc.
  periods: Period[];
}
