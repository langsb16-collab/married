// Type definitions for Global Dating Platform

export type Bindings = {
  DB: D1Database;
};

export type User = {
  id: number;
  email: string;
  phone?: string;
  name: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: string;
  country: string;
  city?: string;
  language: 'ko' | 'en' | 'zh' | 'ja' | 'vi' | 'es' | 'ar';
  bio?: string;
  interests?: string; // JSON string
  mbti?: string;
  verified: number;
  verification_count: number;
  face_verified: number;
  document_verified: number;
  admin_approved: number;
  status: 'active' | 'suspended' | 'deleted';
  membership_tier: 'free' | 'premium';
  points: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
};

export type SocialVerification = {
  id: number;
  user_id: number;
  provider: 'facebook' | 'instagram' | 'kakao' | 'x' | 'naver' | 'google' | 'wechat';
  provider_id: string;
  provider_username?: string;
  verified_at: string;
};

export type UserMedia = {
  id: number;
  user_id: number;
  type: 'photo' | 'video' | 'story';
  url: string;
  thumbnail_url?: string;
  is_profile: number;
  display_order: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  expires_at?: string;
};

export type Match = {
  id: number;
  user1_id: number;
  user2_id: number;
  match_score: number;
  match_type: 'auto' | 'manual' | 'ai';
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  initiated_by: number;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: number;
  sender_id: number;
  receiver_id: number;
  original_text: string;
  original_language: string;
  translated_text?: string;
  translated_language?: string;
  type: 'text' | 'photo' | 'video' | 'voice';
  media_url?: string;
  read_status: number;
  read_at?: string;
  created_at: string;
};

export type VideoCall = {
  id: number;
  caller_id: number;
  receiver_id: number;
  type: 'video' | 'voice';
  status: 'initiated' | 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected';
  session_id?: string;
  start_time: string;
  end_time?: string;
  duration: number;
  quality_rating?: number;
};

export type Notification = {
  id: number;
  user_id: number;
  type: 'match' | 'message' | 'call' | 'gift' | 'like' | 'system';
  title: string;
  content: string;
  related_user_id?: number;
  read_status: number;
  created_at: string;
};

export type UserPreferences = {
  id: number;
  user_id: number;
  min_age: number;
  max_age: number;
  preferred_countries?: string; // JSON string
  max_distance?: number;
  preferred_gender?: 'male' | 'female' | 'both';
  preferred_languages?: string; // JSON string
  preferred_interests?: string; // JSON string
  updated_at: string;
};

export type Gift = {
  id: number;
  name: string;
  description?: string;
  icon_url?: string;
  cost_points: number;
  created_at: string;
};

// API Response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Translation languages
export const LANGUAGES = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  ja: '日本語',
  vi: 'Tiếng Việt',
  es: 'Español',
  ar: 'العربية'
} as const;

export type LanguageCode = keyof typeof LANGUAGES;
