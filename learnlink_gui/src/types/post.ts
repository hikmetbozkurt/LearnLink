export interface Post {
  post_id: string;
  course_id: string;
  author_id: string;
  author_name: string;
  content: string;
  type: 'text' | 'pdf' | 'video';
  file_url?: string;
  created_at: string;
  comments: Comment[];
}

export interface Comment {
  comment_id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
} 