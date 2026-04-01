export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete'

export type GoalType =
  | 'muscle_gain'
  | 'athlete_cut'
  | 'weight_loss'
  | 'maintenance'
  | 'recomposition'
  | 'endurance'
  | 'heart_healthy'
  | 'longevity'
  | 'diabetic'
  | 'recovery'
  | 'custom'

export type Sex = 'male' | 'female' | 'other'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export type FoodGroup = 'protein' | 'grain' | 'vegetable' | 'fruit' | 'dairy' | 'fat' | 'beverage' | 'other'

export type NutritionSource = 'ai_vision' | 'ai_text' | 'memory' | 'user_manual'

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Lightly Active',
  moderate: 'Moderately Active',
  very_active: 'Very Active',
  athlete: 'Competitive Athlete',
}

export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: 'Little or no exercise, desk job',
  light: 'Light exercise 1–3 days/week',
  moderate: 'Moderate exercise 3–5 days/week',
  very_active: 'Hard exercise 6–7 days/week',
  athlete: 'Very hard exercise, physical job, or twice-daily training',
}

export const GOAL_LABELS: Record<GoalType, string> = {
  muscle_gain: 'Muscle Gain / Bulk',
  athlete_cut: 'Athlete Cut',
  weight_loss: 'General Weight Loss',
  maintenance: 'Weight Maintenance',
  recomposition: 'Body Recomposition',
  endurance: 'Endurance Performance',
  heart_healthy: 'Heart Healthy',
  longevity: 'Longevity / Micronutrient Density',
  diabetic: 'Diabetic Management',
  recovery: 'Post-Competition Recovery',
  custom: 'Custom',
}

export const GOAL_FOCUS_METRICS: Record<GoalType, string> = {
  muscle_gain: 'Protein/kg, caloric surplus',
  athlete_cut: 'Protein/kg, caloric deficit',
  weight_loss: 'Calories, caloric deficit',
  maintenance: 'Caloric balance',
  recomposition: 'P/C/F ratio + calories',
  endurance: 'Carbs, hydration',
  heart_healthy: 'Sodium, saturated fat',
  longevity: 'Fiber, sugar, micronutrients',
  diabetic: 'Net carbs, sugar',
  recovery: 'Protein, anti-inflammatory',
  custom: 'User-defined',
}

export const GOAL_DESCRIPTIONS: Record<GoalType, string> = {
  muscle_gain: 'Caloric surplus with high protein to maximize muscle growth',
  athlete_cut: 'Preserve muscle while losing fat with precision deficit',
  weight_loss: 'Sustainable caloric deficit for gradual weight loss',
  maintenance: 'Maintain current weight and body composition',
  recomposition: 'Lose fat and gain muscle simultaneously',
  endurance: 'Fuel sustained athletic performance with carbs and hydration',
  heart_healthy: 'Lower blood pressure and cholesterol markers',
  longevity: 'Maximize antioxidants, fiber, and stable blood sugar',
  diabetic: 'Manage glycemic load and blood sugar levels',
  recovery: 'Anti-inflammatory nutrition with protein focus post-competition',
  custom: 'Define your own nutrition targets',
}

export const DIETARY_PREFERENCE_OPTIONS = [
  'None',
  'Vegetarian',
  'Vegan',
  'Keto',
  'Paleo',
  'Mediterranean',
  'Gluten-Free',
  'Dairy-Free',
  'Low-FODMAP',
] as const

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

// Groq rate limits (free tier, per API key)
export const GROQ_RPM_LIMIT = 30
export const GROQ_RPD_LIMIT = 1000

// Gemini rate limits (free tier, per API key)
export const GEMINI_RPM_LIMIT = 10
export const GEMINI_RPD_LIMIT = 20

// Similarity threshold for meal memory matching
export const MEAL_SIMILARITY_THRESHOLD = 0.85
