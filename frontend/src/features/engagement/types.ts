export interface Avatar {
  style: "STUDENT" | "CAT" | "ROBOT";
  color: string;
  background: string;
  eyes: "ROUND" | "HAPPY";
  accessory: "NONE" | "GLASSES" | "CAP";
}

export interface EngagementPreferences {
  timezone: string;
  notification_tone: "PROFESSIONAL" | "PLAYFUL";
  achievement_notifications: boolean;
  ticker_visible: boolean;
  ticker_categories: string[];
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  earned_at: string | null;
  celebrated_at: string | null;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  timezone: string;
  message: string;
  history_note: string;
  weekly_activity: { date: string; active: boolean }[];
}

export interface News {
  id: string;
  title: string;
  description: string;
  category: string;
  source_url: string | null;
  published_at: string;
  expires_at: string | null;
}
