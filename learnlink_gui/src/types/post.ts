export interface Post {
  post_id: string;
  author_id: number;
  author_name: string;
  content: string;
  type: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  comments: Comment[];
}

export interface Comment {
  comment_id: string;
  author_id: number;
  author_name: string;
  content: string;
  created_at: string;
} 