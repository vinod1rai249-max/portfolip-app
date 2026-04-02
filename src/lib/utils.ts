import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const USER_CONFIG = {
  githubUsername: 'vinod1rai249-max', // Placeholder, user can update
  email: 'vinod1rai249@gmail.com',
};

export const INITIAL_PROFILE = {
  name: "Vinod Rai",
  role: "AI Enthusiast | Python Developer | Cloud Learner",
  bio: "Passionate about building intelligent systems and scalable cloud solutions. Currently exploring the intersection of AI and Physics.",
  profileImage: "https://picsum.photos/seed/vinod/400/400",
  socialLinks: {
    github: "https://github.com/vinod1rai249-max",
    linkedin: "https://www.linkedin.com/in/vinod-rai-23b706392/",
    twitter: "https://twitter.com/vinod1rai249-max"
  }
};
