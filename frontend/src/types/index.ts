// Centralized types for FamilyOS
export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
}

export interface BriefingConfig {
  id: string;
  title: string;
  time: string;
  enabled: boolean;
  content: {
    weather: boolean;
    calendar: boolean;
    meals: boolean;
    emails: boolean;
    budget: boolean;
    traffic: boolean;
    notes: boolean;
  };
}

export interface Settings {
  nickname: string;
  briefing_time: string;
  briefings?: BriefingConfig[];
  budget_limit: number;
  auto_play_briefing: boolean;
  home_address?: string;
  work_address?: string;
  work_arrival_time?: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  category: string;
}

export interface ActionConfig {
  type: "ON" | "PROGRESSIVE" | "VALUE";
  duration?: number; // minutes
  target?: number; // 0-1000
}

export interface TuyaDevice {
  id: string;
  name: string;
  category: string;
  product_name: string;
  online: boolean;
  wakeup_routine: boolean; // Deprecated
  briefing_ids: string[];
  briefing_actions?: Record<string, ActionConfig>;
  wakeup_action: string;
}

export interface TuyaCredentials {
  api_key: string;
  api_secret: string;
  region: string;
}

export interface WeatherData {
  current: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
  recommendation?: {
    summary: string;
    items: string[];
    icon: string;
  };
}

export interface CalendarEvent {
  title: string;
  start: string;
  end: string | null;
  all_day: boolean;
  location: string;
  tags: string[];
  required_items: string[];
}

export interface Meal {
  lunch: string;
  dinner: string;
}

export interface BudgetStatistics {
  monthly_total: number;
  categories: Record<string, number>;
  month_label: string;
}

export interface Email {
  id: string;
  subject: string;
  sender: string;
  snippet: string;
  date: string;
  is_read: boolean;
}
