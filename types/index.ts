export type UserRole = 'admin' | 'professor';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  needs_password_change?: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  registration_number: string | null;
  class_name: string | null;
  status: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string | null;
  email: string | null;
  avatar: string | null;
  role: string;
  availability: string[] | null;
  status: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  subject: string;
  student_name: string;
  teacher_name: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number | null;
  class_type: string | null;
  status: string | null;
  notes: string | null;
  is_test_week: boolean;
  created_at: string;
}

export interface Feedback {
  id: string;
  schedule_id: string | null;
  student_name: string;
  teacher_name: string;
  subject: string;
  class_date: string;
  performance: string | null;
  participation: string | null;
  content: string | null;
  difficulties: string | null;
  observations: string | null;
  rating: number | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string | null;
  amount: number;
  date: string;
  student_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Material {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  file_url: string;
  uploaded_by: string | null;
  uploader_name: string;
  type: 'Revisão' | 'Exercícios' | 'Teoria';
  level: string | null;
  file_size: number | null;
  created_at: string;
}
