export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type DietaryPreference = 'veg' | 'non_veg' | 'vegan' | 'keto';
export type Goal = 'lose' | 'maintain' | 'gain';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodCategory = 'protein' | 'carbs' | 'fat' | 'vegetables';
export type AppView = 'dashboard' | 'nutrition' | 'avatar' | 'profile' | 'leaderboard' | 'form_check' | 'progress';
export type TrainingMode = 'power' | 'endurance' | 'recovery';
export type MuscleGroupName = 'Chest' | 'Quads' | 'Biceps' | 'Back' | 'Shoulders' | 'Hamstrings' | 'Triceps' | 'Core' | 'Abs' | 'Glutes' | 'Calves' | 'Forearms' | 'Lats' | 'Traps';
export type MuscleReadiness = 'fatigued' | 'recovering' | 'ready' | 'primed' | 'fresh' | 'unknown';

export interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  text: string;
  timestamp: number;
}

export interface WorkoutSet {
  id: string;
  exercise: string;
  muscleGroup: MuscleGroupName;
  weight: number;
  reps: number;
  timestamp: number; // ms since epoch
}

export interface SleepEntry {
  date: string;
  hours: number;
  mood: 'great' | 'good' | 'okay' | 'poor';
}

export interface Quest {
  id: string;
  label: string;
  target: number;
  current: number;
  completed: boolean;
}

export interface WearableData {
  heartRate: number;
  hrv: number;
  calories: number;
  isSyncing: boolean;
  lastSync: number;
}

export interface UserProfile {
  id?: string;
  user_id?: string;
  name: string;
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  dietary_preference: DietaryPreference;
  goal: Goal;
  training_mode?: TrainingMode;
  credits: number;
  streak: number;
  unlockedSkins: string[];
  activeSkin?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_veg: boolean;
  is_vegan: boolean;
  is_non_veg: boolean;
  is_keto: boolean;
  meal_type: MealType;
  category: FoodCategory;
  serving_g: number;
}

export interface NutritionMetrics {
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export interface BMIData {
  value: number;
  category: string;
  color: string;
  risk: string;
}

export interface OnboardingData {
  name: string;
  email: string;
  password: string;
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  dietary_preference: DietaryPreference;
  goal: Goal;
}
export interface MacroBreakdown {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  macros: MacroBreakdown;
  isVeg: boolean;
  instructions: string[];
  proteinSource: string; // Used for 3D visualization
  icon?: string;
}

export interface QuestLog {
  date: string;
  questsCompleted: number;
  totalQuests: number;
  creditsEarned: number;
  streakLevel: number;
}
