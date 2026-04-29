import type { UserProfile, BMIData, NutritionMetrics } from '../types';

export function calculateBMI(weight_kg: number, height_cm: number): BMIData {
  const heightM = height_cm / 100;
  const bmi = weight_kg / (heightM * heightM);
  const value = parseFloat(bmi.toFixed(1));

  if (value < 18.5) {
    return { value, category: 'Underweight', color: '#3b82f6', risk: 'Moderate' };
  } else if (value < 25) {
    return { value, category: 'Healthy', color: '#10b981', risk: 'Minimal' };
  } else if (value < 30) {
    return { value, category: 'Overweight', color: '#f59e0b', risk: 'Increased' };
  } else if (value < 35) {
    return { value, category: 'Obese I', color: '#ef4444', risk: 'High' };
  } else {
    return { value, category: 'Obese II', color: '#dc2626', risk: 'Very High' };
  }
}

export function calculateBMR(profile: UserProfile): number {
  const { weight_kg, height_cm, age, gender } = profile;
  if (gender === 'female') {
    return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }
  return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
}

export function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile);
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * (multipliers[profile.activity_level] ?? 1.55));
}

export function calculateNutrition(profile: UserProfile): NutritionMetrics {
  const tdee = calculateTDEE(profile);
  let targetCalories = tdee;

  if (profile.goal === 'lose') targetCalories = Math.round(tdee * 0.8);
  if (profile.goal === 'gain') targetCalories = Math.round(tdee * 1.1);

  let proteinMultiplier =
    profile.goal === 'lose' ? 2.2 : profile.goal === 'gain' ? 1.8 : 1.6;
    
  let targetProtein = Math.round(profile.weight_kg * proteinMultiplier);
  
  if (profile.training_mode === 'power') {
    targetProtein = Math.round(targetProtein * 1.2); // 20% increase
  }

  let targetCarbs: number;
  let targetFat: number;

  if (profile.dietary_preference === 'keto') {
    targetCarbs = 25;
    const remainingCals = targetCalories - targetProtein * 4 - targetCarbs * 4;
    targetFat = Math.round(remainingCals / 9);
  } else {
    const remainingCals = targetCalories - targetProtein * 4;
    targetFat = Math.round((remainingCals * 0.3) / 9);
    targetCarbs = Math.round((remainingCals * 0.7) / 4);
  }

  return { tdee, targetCalories, targetProtein, targetCarbs, targetFat };
}

export function getIdealWeight(height_cm: number, gender: string): number {
  const heightInches = height_cm / 2.54;
  if (gender === 'female') {
    return parseFloat(((45.5 + 2.3 * (heightInches - 60)) * 0.453592).toFixed(1));
  }
  return parseFloat(((50 + 2.3 * (heightInches - 60)) * 0.453592).toFixed(1));
}

export function getBMIAvatarScale(bmi: number): { waistScale: number; shoulderScale: number; hipScale: number } {
  if (bmi < 17) return { waistScale: 0.72, shoulderScale: 0.88, hipScale: 0.78 };
  if (bmi < 18.5) return { waistScale: 0.8, shoulderScale: 0.92, hipScale: 0.85 };
  if (bmi < 22) return { waistScale: 0.9, shoulderScale: 1.0, hipScale: 0.95 };
  if (bmi < 25) return { waistScale: 1.0, shoulderScale: 1.0, hipScale: 1.0 };
  if (bmi < 28) return { waistScale: 1.12, shoulderScale: 1.04, hipScale: 1.1 };
  if (bmi < 30) return { waistScale: 1.22, shoulderScale: 1.06, hipScale: 1.18 };
  if (bmi < 35) return { waistScale: 1.35, shoulderScale: 1.1, hipScale: 1.28 };
  return { waistScale: 1.5, shoulderScale: 1.15, hipScale: 1.4 };
}

export const activityLabels: Record<string, string> = {
  sedentary: 'Sedentary',
  light: 'Light Active',
  moderate: 'Moderately Active',
  active: 'Very Active',
  very_active: 'Extremely Active',
};

export const dietLabels: Record<string, string> = {
  veg: 'Vegetarian',
  non_veg: 'Non-Vegetarian',
  vegan: 'Vegan',
  keto: 'Ketogenic',
};

export const goalLabels: Record<string, string> = {
  lose: 'Fat Loss',
  maintain: 'Maintenance',
  gain: 'Muscle Gain',
};
