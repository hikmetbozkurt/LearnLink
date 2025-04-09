export interface User {
  user_id: string | number;
  id?: string | number;  // Google Auth için
  name: string;
  email: string;
  role?: string;  // Admin kontrolü için
} 