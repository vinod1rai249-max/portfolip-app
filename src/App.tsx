import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Github, Linkedin, Twitter, Mail, ExternalLink, 
  Award, BookOpen, Briefcase, Code, Cpu, 
  MessageSquare, Send, User, ChevronRight,
  Terminal, Zap, Star, Filter, Download,
  BarChart3, BrainCircuit, Rocket, GraduationCap,
  Camera, Loader2, Menu, X, FileText, Eye, Upload, Sun, Moon, Trash2
} from 'lucide-react';
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  doc, updateDoc, getDoc, setDoc, deleteDoc
} from 'firebase/firestore';
import { db, auth, storage } from './lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { GoogleGenAI } from '@google/genai';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, RadarChart, PolarGrid, PolarAngleAxis, 
  Radar, Cell, PieChart, Pie
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { GitHubCalendar } from 'react-github-calendar';
import Tilt from 'react-parallax-tilt';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { cn } from './lib/utils';
import { increment } from 'firebase/firestore';
import { 
  UserProfile, Experience, Achievement, 
  LearningProgress, GithubRepo, ChatMessage 
} from './types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const base64ToBlobUrl = (base64String: string, contentType: string): string | null => {
  try {
    const base64Data = base64String.split(',')[1];
    if (!base64Data) return null;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error creating blob URL", e);
    return null;
  }
};

// --- Components ---

const Navbar = ({ theme, toggleTheme }: { theme: 'dark' | 'light', toggleTheme: () => void }) => {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // Ignore user cancellation
        console.log('Login popup closed by user');
      } else {
        console.error('Login error:', error);
        toast.error(`Login failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleLogout = () => signOut(auth);

  const navItems = [
    { name: 'About', href: '#about' },
    { name: 'Experience', href: '#experience' },
    { name: 'Projects', href: '#projects' },
    { name: 'Certifications', href: '#achievements' },
    { name: 'Dashboard', href: '#dashboard' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
      scrolled ? "bg-black/50 backdrop-blur-md border-b border-white/10" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-display font-bold tracking-tighter flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Cpu size={18} className="text-[#ffffff]" />
          </div>
          <span>NEXUS<span className="text-blue-500">.AI</span></span>
        </motion.div>
        
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item, i) => (
            <motion.a
              key={item.name}
              href={item.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              {item.name}
            </motion.a>
          ))}
          <div className="flex items-center gap-6 border-l border-white/10 pl-8">
            <button 
              onClick={toggleTheme}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a 
              href="https://github.com/vinod1rai249-max" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Github size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden xl:block">GitHub</span>
            </a>
            <a 
              href="https://www.linkedin.com/in/vinod-rai-23b706392/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Linkedin size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden xl:block">LinkedIn</span>
            </a>
          </div>
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-white/10" />
              <button onClick={handleLogout} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              Login
            </motion.button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/90 backdrop-blur-xl border-b border-white/10 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navItems.map((item) => (
                <a 
                  key={item.name} 
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-medium text-gray-400 hover:text-white transition-colors"
                >
                  {item.name}
                </a>
              ))}
              <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                <button 
                  onClick={toggleTheme}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <a href="https://github.com/vinod1rai249-max" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Github size={20} />
                </a>
                <a href="https://www.linkedin.com/in/vinod-rai-23b706392/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Linkedin size={20} />
                </a>
                <a href="mailto:vinod1rai249@gmail.com" className="text-gray-400 hover:text-white">
                  <Mail size={20} />
                </a>
              </div>
              {user ? (
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-10 h-10 rounded-full border border-white/10" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{user.displayName}</span>
                    <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-400 text-left">Logout</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="w-full py-3 bg-blue-600 rounded-xl font-bold mt-2"
                >
                  Login with Google
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ 
  profile, 
  isAdmin, 
  uploading, 
  handleImageUpload,
  handleResumeUpload,
  handleResumeView
}: { 
  profile: UserProfile;
  isAdmin: boolean;
  uploading: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleResumeUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleResumeView: () => Promise<void>;
}) => {
  const [text, setText] = useState('');
  const roles = ["AI Enthusiast", "Python Developer", "Cloud Learner", "Problem Solver"];
  const [roleIndex, setRoleIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleTyping = () => {
      const currentRole = roles[roleIndex];
      if (isDeleting) {
        setText(currentRole.substring(0, text.length - 1));
        setTypingSpeed(50);
      } else {
        setText(currentRole.substring(0, text.length + 1));
        setTypingSpeed(150);
      }

      if (!isDeleting && text === currentRole) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setRoleIndex((roleIndex + 1) % roles.length);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, roleIndex]);

  return (
    <section id="about" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
      
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Zap size={12} /> Available for projects
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-bold leading-tight mb-6">
            Hi, I'm <span className="text-blue-500">{profile.name.split(' ')[0]}</span>
          </h1>
          <div className="text-2xl md:text-3xl font-display text-gray-400 mb-8 h-12">
            I am a <span className="text-white border-r-2 border-blue-500 pr-1">{text}</span>
          </div>
          <p className="text-lg text-gray-400 max-w-lg mb-10 leading-relaxed">
            {profile.bio}
          </p>
          
          <div className="flex items-center gap-6 mb-10">
            <a 
              href="https://www.linkedin.com/in/vinod-rai-23b706392/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-all group"
            >
              <div className="w-10 h-10 glass rounded-lg flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/50 border border-white/5 transition-all">
                <Linkedin size={20} />
              </div>
              <span className="text-sm font-medium">LinkedIn</span>
            </a>
            <a 
              href="https://github.com/vinod1rai249-max" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-all group"
            >
              <div className="w-10 h-10 glass rounded-lg flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/50 border border-white/5 transition-all">
                <Github size={20} />
              </div>
              <span className="text-sm font-medium">GitHub</span>
            </a>
            <a 
              href={`mailto:vinod1rai249@gmail.com`}
              className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-all group"
            >
              <div className="w-10 h-10 glass rounded-lg flex items-center justify-center group-hover:bg-purple-500/10 group-hover:border-purple-500/50 border border-white/5 transition-all">
                <Mail size={20} />
              </div>
              <span className="text-sm font-medium">Email</span>
            </a>
          </div>

          <div className="flex flex-wrap gap-4">
            <a href="#projects" className="px-8 py-4 bg-white text-black rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-all">
              View Projects <ChevronRight size={20} />
            </a>
            <button 
              onClick={() => {
                const chatBtn = document.querySelector('button[class*="w-14 h-14"]') as HTMLButtonElement;
                if (chatBtn) chatBtn.click();
                // We'll handle the actual summarization in the AIChat component by passing a prop or using a custom event
                window.dispatchEvent(new CustomEvent('ai-action', { detail: 'summarize-resume' }));
              }}
              className="px-8 py-4 glass rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10"
            >
              AI Resume Summary <BrainCircuit size={20} className="text-blue-500" />
            </button>
          </div>

          {/* Resume Section */}
          <div className="flex flex-wrap items-center gap-4 mt-8 pt-8 border-t border-white/10">
            {profile.resumeUrl ? (
              <>
                <button 
                  onClick={handleResumeView}
                  className="px-6 py-3 glass rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10 text-sm"
                >
                  <Eye size={16} /> View Resume
                </button>
              </>
            ) : (
              <div className="text-gray-400 text-sm italic flex items-center gap-2">
                <FileText size={16} /> No resume available
              </div>
            )}
            
            {isAdmin && (
              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-600/30 transition-all text-sm border border-blue-500/30"
                >
                  {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                  Upload Resume
                </button>
                <input 
                  type="file" 
                  ref={resumeInputRef} 
                  onChange={handleResumeUpload} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                />
              </div>
            )}
          </div>
          
          {isAdmin && profile.resumeUrl && (
            <div className="flex gap-6 mt-4 text-xs text-gray-400 font-mono">
              <div className="flex items-center gap-1">
                <Eye size={12} className="text-blue-400" /> Views: <span className="text-white">{profile.resumeViews || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download size={12} className="text-green-400" /> Downloads: <span className="text-white">{profile.resumeDownloads || 0}</span>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative"
        >
          <div className="relative z-10 w-full aspect-square max-w-md mx-auto rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl group">
            <img 
              src={profile.profileImage} 
              alt={profile.name} 
              className="w-full h-full object-cover transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {isAdmin && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-4 bg-blue-600 rounded-full text-[#ffffff] hover:bg-blue-700 transition-all transform hover:scale-110"
                >
                  {uploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                </button>
                <p className="text-white text-sm font-bold uppercase tracking-widest">Update Photo</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            )}
          </div>
          {/* Floating Elements */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute -top-6 -right-6 glass p-4 rounded-2xl shadow-xl z-20"
          >
            <BrainCircuit className="text-blue-500 mb-2" />
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Neural Engine</div>
            <div className="text-sm font-bold">Active</div>
          </motion.div>
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ repeat: Infinity, duration: 5, delay: 1 }}
            className="absolute -bottom-6 -left-6 glass p-4 rounded-2xl shadow-xl z-20"
          >
            <div className="flex gap-1 mb-2">
              {[1, 2, 3].map(i => <div key={i} className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Processing</div>
            <div className="text-sm font-bold">98.4% Efficiency</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const ExperienceSection = ({ experiences }: { experiences: Experience[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sortedExperiences = [...experiences].sort((a, b) => a.order - b.order);

  if (!sortedExperiences.length) return null;

  return (
    <section id="experience" className="py-24 max-w-7xl mx-auto px-6">
      <div className="flex items-center gap-4 mb-16">
        <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-blue-500">
          <Briefcase size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold">Work Experience</h2>
          <p className="text-gray-500">My professional journey so far</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12 min-h-[400px]">
        {/* Left/Top: Tabs */}
        <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible hide-scrollbar border-b md:border-b-0 md:border-l border-white/10 md:w-1/4 shrink-0 relative">
          {sortedExperiences.map((exp, index) => (
            <button
              key={exp.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "px-6 py-4 text-left font-medium text-sm whitespace-nowrap transition-all duration-300 relative",
                activeIndex === index ? "text-blue-400 bg-blue-500/5" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              )}
            >
              {exp.company}
              {/* Active Indicator */}
              {activeIndex === index && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 md:h-full md:w-0.5 md:right-auto md:bottom-auto bg-blue-500"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Right/Bottom: Content */}
        <div className="md:w-3/4 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="glass-card h-full"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <h3 className="font-bold text-2xl">
                  {sortedExperiences[activeIndex].role} <span className="text-blue-500">@ {sortedExperiences[activeIndex].company}</span>
                </h3>
                <time className="text-sm font-mono text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg whitespace-nowrap">
                  {sortedExperiences[activeIndex].duration}
                </time>
              </div>
              
              <ul className="space-y-4 mt-8">
                {sortedExperiences[activeIndex].achievements.map((ach, idx) => (
                  <motion.li 
                    key={idx} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="text-gray-300 flex gap-4 leading-relaxed"
                  >
                    <span className="text-blue-500 mt-1.5 shrink-0"><ChevronRight size={16} /></span> 
                    <span>{ach}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const ProjectsSection = () => {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch('https://api.github.com/users/vinod1rai249-max/repos?sort=updated&per_page=100');
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setRepos(data);
          } else {
            // Fallback if no public repos found
            setRepos([
              {
                id: 1,
                name: 'AI-Powered-Portfolio',
                description: 'A modern, responsive portfolio built with React, Tailwind CSS, and Firebase.',
                stargazers_count: 42,
                language: 'TypeScript',
                html_url: 'https://github.com/vinod1rai249-max?tab=repositories',
                topics: ['react', 'firebase', 'ai', 'portfolio']
              }
            ]);
          }
        }
      } catch (error) {
        console.error('Error fetching repos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, []);

  const filters = ['All', 'Python', 'TypeScript', 'JavaScript', 'AI'];
  const filteredRepos = filter === 'All' 
    ? repos 
    : repos.filter(repo => repo.language === filter || repo.topics?.includes(filter.toLowerCase()));

  return (
    <section id="projects" className="py-24 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-blue-500">
              <Code size={24} />
            </div>
            <h2 className="text-3xl font-display font-bold">Featured Projects</h2>
          </div>
          <p className="text-gray-500">Automatically synced with my GitHub repositories</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                filter === f ? "bg-blue-600 text-[#ffffff]" : "glass text-gray-400 hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card h-64 animate-pulse" />
          ))
        ) : (
          filteredRepos.map((repo) => (
            <Tilt key={repo.id} tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02} transitionSpeed={2000} className="h-full">
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card flex flex-col group h-full hover:border-blue-500/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <Terminal className="text-blue-500" size={20} />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Star size={12} className="text-yellow-500" /> {repo.stargazers_count}
                    </div>
                    <a href={repo.html_url} target="_blank" className="text-gray-400 hover:text-white transition-colors">
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors">{repo.name}</h3>
                <p className="text-sm text-gray-400 mb-6 line-clamp-3 flex-grow">
                  {repo.description || "No description provided for this repository."}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {repo.language && (
                    <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-mono text-blue-400 border border-white/10">
                      {repo.language}
                    </span>
                  )}
                  {repo.topics?.slice(0, 3).map(topic => (
                    <span key={topic} className="px-2 py-1 rounded bg-white/5 text-[10px] font-mono text-gray-400 border border-white/10">
                      #{topic}
                    </span>
                  ))}
                </div>
              </motion.div>
            </Tilt>
          ))
        )}
      </div>

      <div className="mt-12 flex justify-center">
        <a 
          href="https://github.com/vinod1rai249-max?tab=repositories" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-8 py-3 glass hover:bg-white/10 rounded-xl font-bold flex items-center gap-2 transition-all group"
        >
          View All Projects <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </a>
      </div>
    </section>
  );
};

const Dashboard = ({ learning }: { learning: LearningProgress[] }) => {
  const skillsData = [
    { subject: 'MuleSoft', A: 95, fullMark: 100 },
    { subject: 'Pega', A: 90, fullMark: 100 },
    { subject: 'AI/ML', A: 85, fullMark: 100 },
    { subject: 'Python', A: 85, fullMark: 100 },
    { subject: 'Cloud', A: 80, fullMark: 100 },
    { subject: 'React', A: 75, fullMark: 100 },
  ];

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch('https://api.github.com/users/vinod1rai249-max/events?per_page=10');
        if (response.ok) {
          const data = await response.json();
          setRecentActivity(data);
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoadingActivity(false);
      }
    };
    fetchActivity();
  }, []);

  return (
    <section id="dashboard" className="py-24 max-w-7xl mx-auto px-6">
      <div className="flex items-center gap-4 mb-16">
        <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-blue-500">
          <BarChart3 size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold">Interactive Dashboard</h2>
          <p className="text-gray-500">Visualizing my skills and growth</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Skills Radar */}
        <div className="glass-card lg:col-span-1">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BrainCircuit size={18} className="text-blue-500" /> Skill Proficiency
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                <PolarGrid stroke="var(--theme-glass-border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--theme-gray-400)', fontSize: 10 }} />
                <Radar
                  name="Proficiency"
                  dataKey="A"
                  stroke="var(--color-accent)"
                  fill="var(--color-accent)"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GitHub Activity */}
        <div className="glass-card lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Github size={18} className="text-blue-500" /> GitHub Activity
          </h3>
          
          <div className="mb-6 overflow-x-auto pb-4">
            <GitHubCalendar 
              username="vinod1rai249-max" 
              colorScheme="dark"
              theme={{
                light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
              }}
            />
          </div>

          <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Recent Events</h4>
          <div className="w-full flex-grow overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '256px' }}>
            {loadingActivity ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-blue-500" size={24} />
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((event, idx) => (
                  <div key={event.id || idx} className="flex gap-4 items-start p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="mt-1 text-blue-400">
                      {event.type === 'PushEvent' ? <Terminal size={16} /> : 
                       event.type === 'CreateEvent' ? <Star size={16} /> : 
                       <Code size={16} />}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-bold text-white">
                          {event.type === 'PushEvent' ? 'Pushed to ' : 
                           event.type === 'CreateEvent' ? 'Created ' : 'Contributed to '}
                        </span>
                        <a href={`https://github.com/${event.repo.name}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {event.repo.name}
                        </a>
                      </p>
                      {event.type === 'PushEvent' && event.payload.commits && event.payload.commits.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                          "{event.payload.commits[0]?.message}"
                        </p>
                      )}
                      <p className="text-[10px] text-gray-500 mt-2 font-mono">
                        {new Date(event.created_at).toLocaleDateString()} at {new Date(event.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No recent activity found.
              </div>
            )}
          </div>
        </div>

        {/* Learning Journey */}
        <div className="glass-card lg:col-span-3">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
            <GraduationCap size={18} className="text-blue-500" /> Learning & Growth Tracker
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {learning.map((item) => (
              <div key={item.id} className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.subject}</span>
                  </div>
                  <span className="text-xs font-mono text-blue-400">{item.progress}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.progress}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  Status: <span className={cn(
                    item.status === 'learning' ? "text-yellow-500" : "text-green-500"
                  )}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const getCertLogo = (title: string, issuer: string) => {
  const text = `${title} ${issuer}`.toLowerCase();
  if (text.includes('mulesoft')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/MuleSoft_Logo.svg/512px-MuleSoft_Logo.svg.png';
  if (text.includes('pega')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Pegasystems_logo.svg/512px-Pegasystems_logo.svg.png';
  if (text.includes('aws') || text.includes('amazon')) return 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg';
  if (text.includes('google') || text.includes('gcp')) return 'https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg';
  if (text.includes('microsoft') || text.includes('azure')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg';
  if (text.includes('salesforce')) return 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg';
  if (text.includes('oracle')) return 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg';
  if (text.includes('cisco')) return 'https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg';
  if (text.includes('ibm')) return 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg';
  if (text.includes('kubernetes') || text.includes('cka')) return 'https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg';
  if (text.includes('docker')) return 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Docker_%28container_engine%29_logo.svg';
  if (text.includes('python')) return 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg';
  if (text.includes('react')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg';
  if (text.includes('pmp') || text.includes('project management')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Project_Management_Institute_Logo.svg/512px-Project_Management_Institute_Logo.svg.png';
  
  // Fallback generic badge
  return 'https://cdn-icons-png.flaticon.com/512/2874/2874368.png';
};

const formatCertTitle = (title: string) => {
  if (title.includes('CERTIFICATION_Pega Certified Senior System Architect')) return 'Pega Certified Senior System Architect';
  if (title.includes('CERTIFICATION_Pega Certified System Architect')) return 'Pega Certified System Architect';
  if (title.includes('Mulesoft_MCD_level_1')) return 'MuleSoft Certified Developer - Level 1';
  if (title.includes('Vinod_PMP_certificate')) return 'Project Management Professional (PMP)';
  return title;
};

const formatCertIssuer = (issuer: string) => {
  if (issuer.includes('Pega Certified Senior system Architect')) return 'Pegasystems';
  if (issuer.includes('Pega Certified System Architect')) return 'Pegasystems';
  if (issuer.includes('mulesoft_MCD_level1')) return 'MuleSoft';
  if (issuer.includes('Vinod_PMP_certificate')) return 'Project Management Institute';
  return issuer;
};

const AchievementsSection = ({ achievements, isAdmin }: { achievements: Achievement[], isAdmin: boolean }) => {
  const [selectedAch, setSelectedAch] = useState<Achievement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [certTitle, setCertTitle] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedAch?.certificateUrl?.startsWith('data:application/pdf')) {
      const url = base64ToBlobUrl(selectedAch.certificateUrl, 'application/pdf');
      setPdfBlobUrl(url);
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    } else {
      setPdfBlobUrl(null);
    }
  }, [selectedAch]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setCertTitle(file.name.split('.')[0]);
    }
  };

  const handleUpdateSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAch || !auth.currentUser) return;

    if (file.size > 700 * 1024) {
      toast.error('File is too large. Please upload a file smaller than 700KB.');
      return;
    }

    setUploading(true);
    try {
      const base64File = await fileToBase64(file);
      const docRef = doc(db, 'users', 'vinod-rai-profile', 'achievements', selectedAch.id);
      await setDoc(docRef, { certificateUrl: base64File }, { merge: true });
      
      setSelectedAch(prev => prev ? { ...prev, certificateUrl: base64File } : null);
      toast.success('Certification updated successfully!');
    } catch (error) {
      console.error('Error updating certification:', error);
      toast.error('Failed to update certification.');
    } finally {
      setUploading(false);
      if (updateInputRef.current) updateInputRef.current.value = '';
    }
  };

  const handleFileUpload = async () => {
    if (!pendingFile || !auth.currentUser) {
      console.log('Upload aborted: No file or user not logged in', { pendingFile, user: auth.currentUser });
      return;
    }

    if (pendingFile.size > 700 * 1024) {
      toast.error('File is too large. Please upload a file smaller than 700KB.');
      return;
    }

    setUploading(true);
    console.log('Starting certification upload...', pendingFile.name);
    try {
      const base64File = await fileToBase64(pendingFile);
      console.log('File converted to base64');

      // Add to Firestore
      const path = `users/vinod-rai-profile/achievements`;
      try {
        const docRef = await addDoc(collection(db, 'users', 'vinod-rai-profile', 'achievements'), {
          title: certTitle || pendingFile.name.split('.')[0],
          issuer: certIssuer || 'Self Uploaded',
          date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          link: '#',
          icon: '📜',
          description: 'User uploaded certification document.',
          certificateUrl: base64File,
          uid: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        console.log('Achievement added to Firestore with ID:', docRef.id);
      } catch (error) {
        console.error('Firestore addDoc error:', error);
        handleFirestoreError(error, OperationType.WRITE, path);
      }

      toast.success('Certification uploaded successfully!');
      setPendingFile(null);
      setCertTitle('');
      setCertIssuer('');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAchievement = async (e: React.MouseEvent, achId: string) => {
    e.stopPropagation();
    
    try {
      const path = `users/vinod-rai-profile/achievements/${achId}`;
      await deleteDoc(doc(db, 'users', 'vinod-rai-profile', 'achievements', achId));
      toast.success('Achievement deleted successfully!');
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast.error('Failed to delete achievement');
    }
  };

  return (
    <section id="achievements" className="py-24 max-w-7xl mx-auto px-6">
      <div className="flex items-center gap-4 mb-16">
        <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-blue-500">
          <Award size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold">Certifications & Achievements</h2>
          <p className="text-gray-500">Milestones and official recognitions</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {achievements.map((ach) => (
          <Tilt key={ach.id} tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000} className="h-full">
            <motion.div 
              whileHover={{ y: -5 }}
              onClick={() => setSelectedAch(ach)}
              className="glass-card p-0 flex flex-col items-center text-center group cursor-pointer relative h-full hover:border-blue-500/50 transition-all overflow-hidden"
            >
              {isAdmin && (
                <button
                  onClick={(e) => handleDeleteAchievement(e, ach.id)}
                  className="absolute top-3 right-3 p-2 bg-red-500/20 text-red-500 rounded-full transition-all hover:bg-red-500 hover:text-white z-20 shadow-lg"
                  title="Delete Achievement"
                >
                  <Trash2 size={16} />
                </button>
              )}
              
              {/* Thumbnail Area */}
              <div className="w-full h-48 relative overflow-hidden border-b border-white/10 flex-shrink-0 flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-[#0a0f1c] to-black group-hover:from-slate-800 transition-all duration-500">
                {/* Decorative background glow */}
                <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/40 transition-colors duration-700"></div>
                  <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/40 transition-colors duration-700"></div>
                </div>
                
                <img 
                  src={getCertLogo(ach.title, ach.issuer)} 
                  alt={ach.title} 
                  className="w-28 h-28 object-contain relative z-10 group-hover:scale-110 transition-transform duration-700 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/2874/2874368.png';
                  }}
                />
              </div>

              {/* Content Area */}
              <div className="p-6 flex flex-col items-center text-center flex-1 w-full">
                <h3 className="font-bold mb-2 line-clamp-2">{formatCertTitle(ach.title)}</h3>
                {ach.title !== 'Safe Agile 5.0' && (
                  <>
                    <p className="text-sm text-gray-500 mb-4">{formatCertIssuer(ach.issuer)}</p>
                    <div className="text-xs font-mono text-blue-400 mb-6">{ach.date}</div>
                  </>
                )}
                <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-blue-400 transition-colors">
                  View Certificate <ExternalLink size={12} />
                </div>
              </div>
            </motion.div>
          </Tilt>
        ))}

        {isAdmin && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "glass-card flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10 bg-white/[0.02] cursor-pointer group hover:border-blue-500/50 transition-all min-h-[280px]",
              uploading && "opacity-50 cursor-wait"
            )}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-gray-600 group-hover:text-blue-500 transition-colors mb-4">
              {uploading ? <Zap className="animate-spin" size={32} /> : <Rocket size={32} className="animate-bounce" />}
            </div>
            <h3 className="font-bold text-gray-400 group-hover:text-white transition-colors">
              {uploading ? "Uploading..." : "Upload New"}
            </h3>
            <p className="text-xs text-gray-500 mt-2">Drag & drop your certificate PDF or Image here</p>
            <div className="mt-6 px-4 py-2 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
              {uploading ? "Please wait" : "Browse Files"}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept="image/*,.pdf"
            />
          </motion.div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {pendingFile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card max-w-md w-full p-8"
            >
              <h3 className="text-xl font-bold mb-6">Upload Certification</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Certificate Name</label>
                  <input 
                    type="text" 
                    value={certTitle}
                    onChange={e => setCertTitle(e.target.value)}
                    className="w-full glass bg-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="e.g. AWS Certified Solutions Architect"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Issuer</label>
                  <input 
                    type="text" 
                    value={certIssuer}
                    onChange={e => setCertIssuer(e.target.value)}
                    className="w-full glass bg-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="e.g. Amazon Web Services"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setPendingFile(null)}
                    className="flex-1 px-6 py-3 glass rounded-xl font-bold hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleFileUpload}
                    disabled={uploading}
                    className="flex-1 px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    {uploading ? <Loader2 className="animate-spin" size={20} /> : "Upload"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certification Modal */}
      <AnimatePresence>
        {selectedAch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAch(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="glass-card max-w-4xl w-full p-0 overflow-hidden relative"
            >
              <button 
                onClick={() => setSelectedAch(null)}
                className="absolute top-4 right-4 z-10 p-2 glass rounded-full hover:bg-white/10 transition-all"
              >
                <ChevronRight className="rotate-90" />
              </button>
              
              <div className="flex flex-col">
                <div className="h-[60vh] border-b bg-gradient-to-b from-black/60 to-black/90 flex items-center justify-center overflow-hidden border-white/10 relative p-8">
                  {selectedAch.certificateUrl?.startsWith('data:application/pdf') ? (
                    pdfBlobUrl ? (
                      <object 
                        data={pdfBlobUrl + '#toolbar=0&navpanes=0&scrollbar=0'} 
                        type="application/pdf"
                        className="w-full h-full max-w-4xl border border-white/10 shadow-2xl shadow-black/80 rounded bg-white relative z-10"
                      >
                        <div className="flex flex-col items-center justify-center h-full p-6 text-center z-10 relative bg-black/50">
                          <FileText size={48} className="text-gray-400 mb-4" />
                          <p className="text-gray-300 mb-6">Your browser is blocking the embedded PDF viewer.</p>
                          <a 
                            href={pdfBlobUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-[#ffffff] rounded-xl font-bold transition-all"
                          >
                            Open PDF in New Tab
                          </a>
                        </div>
                      </object>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">Loading PDF...</div>
                    )
                  ) : (
                    <img 
                      src={selectedAch.certificateUrl || `https://picsum.photos/seed/${selectedAch.id}/800/600`} 
                      alt={selectedAch.title} 
                      className="max-w-full max-h-full object-contain border border-white/10 shadow-2xl shadow-black/80 rounded relative z-10"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div className="p-8 flex flex-col items-center text-center">
                  {selectedAch.title !== 'Safe Agile 5.0' && (
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-6">
                      <span className="text-2xl">{selectedAch.icon}</span>
                    </div>
                  )}
                  <h3 className="font-display font-bold mb-2 text-3xl">{formatCertTitle(selectedAch.title)}</h3>
                  {selectedAch.title !== 'Safe Agile 5.0' && (
                    <>
                      <p className="text-blue-400 font-medium mb-4">{formatCertIssuer(selectedAch.issuer)}</p>
                      <div className="text-sm text-gray-400 mb-8 leading-relaxed max-w-2xl">
                        {selectedAch.description || `Official certification issued in ${selectedAch.date}. This credential verifies the technical proficiency and expertise in ${formatCertTitle(selectedAch.title).split(' ')[0]} systems and methodologies.`}
                      </div>
                      <div className="mt-auto space-y-4 w-full max-w-md">
                        <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                          <span className="text-gray-500">Issue Date</span>
                          <span className="font-mono">{selectedAch.date}</span>
                        </div>
                        <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                          <span className="text-gray-500">Credential ID</span>
                          <span className="font-mono">VR-{selectedAch.id}-2024</span>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="mt-auto space-y-4 pt-6 w-full max-w-md">
                    {selectedAch.link !== '#' && (
                      <a 
                        href={selectedAch.link}
                        target="_blank"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-6"
                      >
                        Verify on Official Site <ExternalLink size={16} />
                      </a>
                    )}
                    {isAdmin && (
                      <>
                        <button 
                          onClick={() => updateInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full py-3 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                          {uploading ? 'Updating...' : 'Update Document'} <Upload size={16} />
                        </button>
                        <input 
                          type="file" 
                          ref={updateInputRef} 
                          onChange={handleUpdateSelect} 
                          accept="image/*,application/pdf" 
                          className="hidden" 
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const AIChat = ({ profile, theme }: { profile: UserProfile, theme: 'dark' | 'light' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hi! I'm ${profile.name}'s AI Assistant. Ask me anything about their skills, projects, or experience!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendRef = useRef<(overrideInput?: string) => Promise<void>>(() => Promise.resolve());
  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  useEffect(() => {
    const handleAIAction = (e: any) => {
      setIsOpen(true);
      if (e.detail === 'summarize-resume') {
        handleSendRef.current("Can you give me a quick summary of your resume and key strengths?");
      }
    };
    window.addEventListener('ai-action', handleAIAction);
    return () => window.removeEventListener('ai-action', handleAIAction);
  }, []);

  const handleSend = async (overrideInput?: string) => {
    const userMsg = overrideInput || input;
    if (!userMsg.trim() || loading) return;

    if (!overrideInput) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `You are an AI assistant for ${profile.name}'s portfolio. 
          Bio: ${profile.bio}. Role: ${profile.role}. 
          Answer questions about them professionally and enthusiastically. 
          Keep responses concise and formatted in markdown.
          If asked about projects, mention they are synced from GitHub and suggest relevant ones based on their query.
          If asked for a resume summary, provide a high-impact 3-bullet summary focusing on AI, Python, and Cloud skills.`
        }
      });
      
      setMessages(prev => [...prev, { role: 'model', text: response.text || 'I am sorry, I could not process that.' }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'Error connecting to AI engine.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="glass-card w-80 md:w-96 h-[500px] mb-4 flex flex-col shadow-2xl border-blue-500/20"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm">Nexus AI</div>
                  <div className="text-[10px] text-green-500 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                <ChevronRight className="rotate-90" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-grow overflow-y-auto py-4 space-y-4 no-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm",
                    msg.role === 'user' ? "bg-blue-600 text-[#ffffff]" : "glass text-gray-300"
                  )}>
                    <div className={cn("prose prose-sm", msg.role === 'user' || theme === 'dark' ? "prose-invert" : "")}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="glass p-3 rounded-2xl flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button 
                onClick={() => handleSend()}
                className="p-2 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button 
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-600/40 relative"
      >
        <MessageSquare size={24} />
        {!isOpen && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center text-[8px] font-bold">1</div>}
      </motion.button>
    </div>
  );
};

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await addDoc(collection(db, 'messages'), {
        ...form,
        timestamp: serverTimestamp()
      });
      
      // Open mailto link to actually send the email
      window.location.href = `mailto:vinod1rai249@gmail.com?subject=Message from ${form.name}&body=${encodeURIComponent(form.message + '\n\nFrom: ' + form.email)}`;
      
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

  return (
    <section id="contact" className="py-24 max-w-7xl mx-auto px-6">
      <div className="glass-card grid md:grid-cols-2 gap-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div>
          <h2 className="text-4xl font-display font-bold mb-6">Let's build something <span className="text-blue-500 italic">extraordinary</span>.</h2>
          <p className="text-gray-400 mb-12 leading-relaxed">
            Whether you have a question, a project idea, or just want to say hi, my inbox is always open.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-blue-500">
                <Mail size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Email</div>
                <div className="font-medium">vinod1rai249@gmail.com</div>
              </div>
            </div>
            <a 
              href="https://github.com/vinod1rai249-max" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 group cursor-pointer"
            >
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Github size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">GitHub</div>
                <div className="font-medium group-hover:text-blue-400 transition-colors">@vinod1rai249-max</div>
              </div>
            </a>
            <a 
              href="https://www.linkedin.com/in/vinod-rai-23b706392/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 group cursor-pointer"
            >
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Linkedin size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">LinkedIn</div>
                <div className="font-medium group-hover:text-blue-400 transition-colors">Vinod Rai</div>
              </div>
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Name</label>
              <input 
                required
                type="text" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full glass bg-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email</label>
              <input 
                required
                type="email" 
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full glass bg-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Message</label>
            <textarea 
              required
              rows={4}
              value={form.message}
              onChange={e => setForm({...form, message: e.target.value})}
              className="w-full glass bg-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all resize-none"
              placeholder="Your message here..."
            />
          </div>
          <button 
            disabled={status !== 'idle'}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
          >
            {status === 'sending' ? "Transmitting..." : status === 'success' ? "Message Received!" : "Send Message"} 
            <Send size={18} />
          </button>
        </form>
      </div>
    </section>
  );
};

// --- Main App ---

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    const handleMouseOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName.toLowerCase() === 'button' || 
          (e.target as HTMLElement).tagName.toLowerCase() === 'a' ||
          (e.target as HTMLElement).closest('button') ||
          (e.target as HTMLElement).closest('a')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-6 h-6 rounded-full border-2 border-blue-500 pointer-events-none z-[9999] mix-blend-difference flex items-center justify-center hidden md:flex"
      animate={{
        x: mousePosition.x - 12,
        y: mousePosition.y - 12,
        scale: isHovering ? 1.5 : 1,
        backgroundColor: isHovering ? 'rgba(59, 130, 246, 0.5)' : 'transparent'
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.5 }}
    >
      <div className="w-1 h-1 bg-blue-500 rounded-full" />
    </motion.div>
  );
};

const ReactionsWidget = () => {
  const [reactions, setReactions] = useState({ heart: 0, rocket: 0, bulb: 0 });
  
  useEffect(() => {
    const docRef = doc(db, 'portfolio_stats', 'reactions');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setReactions(docSnap.data() as any);
      } else {
        setDoc(docRef, { heart: 0, rocket: 0, bulb: 0 }).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleReact = async (type: string) => {
    const docRef = doc(db, 'portfolio_stats', 'reactions');
    try {
      await updateDoc(docRef, {
        [type]: increment(1)
      });
    } catch (err: any) {
      if (err.code === 'not-found') {
        await setDoc(docRef, { heart: 0, rocket: 0, bulb: 0, [type]: 1 }).catch(console.error);
      }
    }
  };

  return (
    <div className="fixed left-6 bottom-6 z-40 flex flex-col gap-2">
      <button onClick={() => handleReact('heart')} className="glass-card p-2 rounded-full hover:scale-110 transition-transform flex items-center gap-2 text-sm border-white/10 hover:border-pink-500/50">
        ❤️ <span>{reactions.heart}</span>
      </button>
      <button onClick={() => handleReact('rocket')} className="glass-card p-2 rounded-full hover:scale-110 transition-transform flex items-center gap-2 text-sm border-white/10 hover:border-blue-500/50">
        🚀 <span>{reactions.rocket}</span>
      </button>
      <button onClick={() => handleReact('bulb')} className="glass-card p-2 rounded-full hover:scale-110 transition-transform flex items-center gap-2 text-sm border-white/10 hover:border-yellow-500/50">
        💡 <span>{reactions.bulb}</span>
      </button>
    </div>
  );
};


export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [learning, setLearning] = useState<LearningProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [uploading, setUploading] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const isAdmin = user?.email === 'vinod1rai249@gmail.com';

  useEffect(() => {
    // Check initial theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  useEffect(() => {
    // Fetch profile from Firestore
    const fetchProfile = async () => {
      // We'll use a fixed ID 'main-profile' for the portfolio owner's profile
      // or we could use the UID if we had it. For now, let's try to get it by a known path.
      // In a real app, you might query by email or use a specific document ID.
      const profileDoc = doc(db, 'users', 'vinod-rai-profile');
      const docSnap = await getDoc(profileDoc);

      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        // Fallback to default if not in DB
        const defaultProfile: UserProfile = {
          name: "Vinod Rai",
          role: "Technical Lead | AI & ML Enthusiast | MuleSoft & Pega Expert",
          bio: "Strategic engineering leader with 20+ years of success delivering enterprise-grade software across IBM Mainframe, Pega, and MuleSoft. Currently deepening expertise in Generative AI and Agentic AI at IIT Roorkee.",
          profileImage: "https://picsum.photos/seed/vinod1rai249-max/600/600",
          socialLinks: {
            github: "https://github.com/vinod1rai249-max",
            linkedin: "https://www.linkedin.com/in/vinod-rai-23b706392/",
            twitter: "https://twitter.com/vinod1rai249-max"
          }
        };
        setProfile(defaultProfile);
        // Optionally save it to DB if admin is logged in
        if (isAdmin && user) {
          await setDoc(profileDoc, defaultProfile);
          // Also ensure the user document exists with admin role
          const userDoc = doc(db, 'users', user.uid);
          await setDoc(userDoc, {
            name: user.displayName,
            email: user.email,
            role: 'admin'
          }, { merge: true });
        }
      }
    };

    fetchProfile();
  }, [user, isAdmin]); // Re-run when user changes to handle the "save default" logic

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 700 * 1024) {
      toast.error('Image is too large. Please upload an image smaller than 700KB.');
      return;
    }

    setUploading(true);
    try {
      const base64Image = await fileToBase64(file);

      // Update Firestore
      const profileDoc = doc(db, 'users', 'vinod-rai-profile');
      await setDoc(profileDoc, {
        profileImage: base64Image
      }, { merge: true });

      // Update local state
      setProfile(prev => prev ? { ...prev, profileImage: base64Image } : null);
      toast.success('Profile photo updated!');
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(`Failed to update profile photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Resume is too large. Please upload a file smaller than 2MB.');
      return;
    }

    setUploading(true);
    try {
      const base64Resume = await fileToBase64(file);

      // Update Firestore
      const profileDoc = doc(db, 'users', 'vinod-rai-profile');
      await setDoc(profileDoc, {
        resumeUrl: base64Resume,
        resumeFileName: file.name,
        resumeViews: profile?.resumeViews || 0,
        resumeDownloads: profile?.resumeDownloads || 0
      }, { merge: true });

      // Update local state
      setProfile(prev => prev ? { 
        ...prev, 
        resumeUrl: base64Resume, 
        resumeFileName: file.name,
        resumeViews: prev.resumeViews || 0,
        resumeDownloads: prev.resumeDownloads || 0
      } : null);
      toast.success('Resume uploaded successfully!');
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast.error(`Failed to upload resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleResumeView = async () => {
    if (!profile?.resumeUrl) return;

    // Open resume in new tab IMMEDIATELY before any async operations to prevent popup blocker
    let urlToOpen = profile.resumeUrl;
    
    // If it's a base64 PDF, convert to blob URL to prevent Chrome blocking
    if (profile.resumeUrl.startsWith('data:application/pdf')) {
      const blobUrl = base64ToBlobUrl(profile.resumeUrl, 'application/pdf');
      if (blobUrl) {
        urlToOpen = blobUrl;
      }
    }

    const pdfWindow = window.open(urlToOpen, '_blank');
    if (!pdfWindow) {
      toast.error('Please allow popups to view the resume.');
    }

    try {
      // Increment view count in Firestore asynchronously
      const profileDoc = doc(db, 'users', 'vinod-rai-profile');
      const newViews = (profile.resumeViews || 0) + 1;
      await setDoc(profileDoc, { resumeViews: newViews }, { merge: true });

      // Update local state
      setProfile(prev => prev ? { ...prev, resumeViews: newViews } : null);
    } catch (error) {
      console.error("Error viewing resume:", error);
    }
  };

  useEffect(() => {
    setExperiences([
      {
        id: '1',
        company: 'Quest Diagnostics HTAS Pvt Ltd',
        role: 'Technical Lead',
        duration: 'Oct 2018 - Present',
        achievements: [
          'Specialized in MuleSoft development, taking ownership of implementation and support for enterprise integration.',
          'Led cross-functional engineering teams overseeing end-to-end delivery of scalable APIs and BPM systems.',
          'Championed Agile transformation and established DevSecOps practices within the API development lifecycle.',
          'Developed reusable frameworks and design templates to drive consistency across multiple teams.'
        ],
        order: 1
      },
      {
        id: '2',
        company: 'JP Morgan Chase India Services Pvt Ltd',
        role: 'Associate Application Developer',
        duration: 'Sep 2010 - Oct 2018',
        achievements: [
          'Developed and maintained complex banking applications on IBM Mainframe.',
          'Engaged in Agile ceremonies and sprint planning to ensure timely, quality software delivery.'
        ],
        order: 2
      },
      {
        id: '3',
        company: 'Bank of America Continuum Solutions',
        role: 'Analyst Application Programmer - I',
        duration: 'Jan 2010 - Sep 2010',
        achievements: [
          'Maintained and enhanced critical Mainframe applications supporting investment banking functions.',
          'Collaborated on performance tuning and defect management to optimize application stability.'
        ],
        order: 3
      },
      {
        id: '4',
        company: 'HSBC Global Technology (GLT)',
        role: 'Senior Software Engineer',
        duration: 'Apr 2005 - Jan 2010',
        achievements: [
          'Developed financial services modules on IBM Mainframe focusing on risk and compliance.',
          'Recognized for innovation and excellence in software quality and delivery.'
        ],
        order: 4
      }
    ]);

    setLearning([
      { id: '1', subject: 'Generative & Agentic AI (IIT Roorkee)', progress: 45, status: 'learning', icon: '🤖' },
      { id: '2', subject: 'MuleSoft Integration', progress: 100, status: 'completed', icon: '🔌' },
      { id: '3', subject: 'Pega Systems Architecture', progress: 100, status: 'completed', icon: '🏗️' }
    ]);
  }, []);

  useEffect(() => {
    // Fetch from Firestore (always, so everyone sees them)
    const q = query(collection(db, 'users', 'vinod-rai-profile', 'achievements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreAchievements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Achievement[];
      
      // Auto-delete duplicate "PrintAchievemen - Vinod Rai_compressed"
      const duplicates = firestoreAchievements.filter(a => a.title.includes('PrintAchievemen'));
      if (duplicates.length > 1) {
        // Delete the first one (oldest or newest depending on sort, let's just delete the first one in the array)
        deleteDoc(doc(db, 'users', 'vinod-rai-profile', 'achievements', duplicates[0].id))
          .then(() => console.log('Deleted duplicate achievement'))
          .catch(e => console.error('Error deleting duplicate', e));
      }

      // Clean up the title text without removing the certification itself
      const processedAchievements = firestoreAchievements.map(a => {
        let cleanTitle = a.title
          .replace(/PrintAchievemen?t?\s*-\s*Vinod Rai_compressed/gi, '')
          .replace(/PrintAchievemen?t?/gi, '') // Just in case it's only this word
          .replace(/^-\s*/, '') // Remove leading hyphens if any are left
          .trim();
          
        // Force exact title for Safe Agile
        if (cleanTitle.toLowerCase().includes('safe') || cleanTitle.toLowerCase().includes('agile')) {
          cleanTitle = 'Safe Agile 5.0';
        }
        
        return {
          ...a,
          title: cleanTitle || 'Certification' // Fallback if the title becomes completely empty
        };
      });
      setAchievements(processedAchievements);
    }, (error) => {
      console.error("Error fetching achievements:", error);
    });
    return () => unsubscribe();
  }, []);

  if (!profile) return <div className="min-h-screen bg-black flex items-center justify-center"><Zap className="text-blue-500 animate-pulse" size={48} /></div>;

  return (
    <div className="relative min-h-screen">
      <CustomCursor />
      <ReactionsWidget />
      {/* Professional Photo Background */}
      <div className="fixed inset-0 z-[-1] bg-[var(--theme-bg)]">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" 
          alt="Professional Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-10 dark:opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--theme-bg)]/80 via-[var(--theme-bg)]/90 to-[var(--theme-bg)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />
      </div>

      <Toaster position="top-right" theme={theme} richColors />
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <Hero 
        profile={profile} 
        isAdmin={isAdmin} 
        uploading={uploading} 
        handleImageUpload={handleImageUpload}
        handleResumeUpload={handleResumeUpload}
        handleResumeView={handleResumeView}
      />
      <ExperienceSection experiences={experiences} />
      <ProjectsSection />
      <AchievementsSection achievements={achievements} isAdmin={isAdmin} />
      <Dashboard learning={learning} />
      <Contact />
      
      <footer className="py-12 border-t border-white/10 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <p>© {new Date().getFullYear()} Nexus Portfolio. Built with React, Firebase & Gemini AI.</p>
        </div>
      </footer>

      <AIChat profile={profile} theme={theme} />
    </div>
  );
}
