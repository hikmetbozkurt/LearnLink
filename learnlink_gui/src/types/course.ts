export interface Course {
  _id: string;
  course_id: string;
  title: string;
  name?: string;  // Geriye dönük uyumluluk için
  instructor_id: string | number;
  instructor_name: string;
  student_count?: number;
  description?: string;
  admin_id: string;
  is_admin: boolean;
  is_enrolled: boolean;
  created_at: string;
  max_students: number;
  image?: string;
} 