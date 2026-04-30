export interface UserProfile {
  name: string;
  role: string;
  bio: string;
  profileImage: string;
  socialLinks: {
    github: string;
    linkedin: string;
    twitter: string;
  };
  resumeUrl?: string;
  resumeFileName?: string;
  resumeViews?: number;
  resumeDownloads?: number;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  duration: string;
  achievements: string[];
  order: number;
}

export interface Achievement {
  id: string;
  title: string;
  issuer: string;
  date: string;
  link: string;
  icon: string;
  description?: string;
  certificateUrl?: string;
}

export interface LearningProgress {
  id: string;
  subject: string;
  progress: number;
  status: 'learning' | 'completed' | 'planned';
  icon: string;
}

export interface GithubRepo {
  id: number | string;
  name: string;
  description: string;
  stargazers_count: number;
  language: string;
  html_url: string;
  topics: string[];
  live_url?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
