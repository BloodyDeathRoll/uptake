'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ChevronDown } from 'lucide-react'

// ─── Translation objects ────────────────────────────────────────────────────

const en = {
  // Common
  back: 'Back',
  next: 'Next',
  save: 'Save',
  cancel: 'Cancel',
  add: 'Add',
  skip: 'Skip',
  try_again: 'Try again',
  optional: 'optional',
  // Language
  lang_en: 'English',
  lang_he: 'עברית',
  // Nav
  nav_today: 'Today',
  nav_log: 'Log',
  nav_weekly: 'Weekly',
  nav_settings: 'Settings',
  // Auth
  sign_in: 'Sign in',
  sign_up: 'Sign up',
  sign_in_subtitle: 'Sign in to track your nutrition',
  create_account: 'Create account',
  create_account_subtitle: 'Start tracking your nutrition today',
  continue_google: 'Continue with Google',
  continue_microsoft: 'Continue with Microsoft',
  or_divider: 'or',
  email_field: 'Email',
  password_field: 'Password',
  confirm_password: 'Confirm password',
  signing_in: 'Signing in…',
  creating_account: 'Creating account…',
  redirecting: 'Redirecting…',
  no_account: 'No account?',
  already_account: 'Already have an account?',
  err_oauth: 'OAuth sign-in failed. Please try again.',
  err_passwords_mismatch: 'Passwords do not match',
  err_password_short: 'Password must be at least 8 characters',
  forgot_password: 'Forgot password?',
  forgot_password_title: 'Reset your password',
  forgot_password_subtitle: "Enter your email and we'll send you a reset link",
  send_reset_link: 'Send reset link',
  sending_reset: 'Sending…',
  reset_link_sent: 'Check your email for a password reset link.',
  reset_password_title: 'Set new password',
  new_password_field: 'New password',
  update_password: 'Update password',
  updating_password: 'Updating…',
  password_updated: 'Password updated! Signing you in…',
  back_to_sign_in: 'Back to sign in',
  // Onboarding - About You
  about_you: 'About you',
  about_you_subtitle: 'Your stats & food preferences',
  height: 'Height',
  weight: 'Weight',
  age: 'Age',
  sex: 'Sex',
  sex_male: 'male',
  sex_female: 'female',
  diet_label: 'Diet',
  allergies_label: 'Allergies',
  allergy_placeholder: 'e.g. peanuts, diabetes',
  start: 'Start',
  err_height: 'Enter a valid height (50–300 cm)',
  err_weight: 'Enter a valid weight',
  err_age: 'Enter a valid age (1–120)',
  // Onboarding - Activity
  activity_level: 'Activity level',
  activity_subtitle: 'How active are you on a typical week?',
  // Onboarding - Goal
  your_goal: 'Your goal',
  goal_subtitle: "We'll optimize your targets around this",
  finalize: 'Finalize',
  focus_prefix: 'Focus: ',
  // Onboarding - Preferences
  your_preferences: 'Your preferences',
  preferences_subtitle: 'Helps personalize your meal suggestions',
  dietary_preferences: 'Dietary preferences',
  allergies_exclusions: 'Allergies / Health Restrictions',
  meals_per_day: 'Typical meals per day',
  // Onboarding - Review
  your_targets: 'Your targets',
  personalized_for: 'Personalized for',
  daily_calories: 'Daily calories',
  protein: 'Protein',
  carbohydrates: 'Carbohydrates',
  fat_label: 'Fat',
  fiber: 'Fiber',
  water: 'Water',
  setting_up: 'Setting up…',
  start_tracking: 'Start tracking',
  calculating_targets: 'Calculating your targets…',
  err_calculate_targets: 'Failed to calculate targets. Please try again.',
  // Dashboard
  remaining_today: 'Remaining today',
  calories: 'Calories',
  carbs: 'Carbs',
  fat: 'Fat',
  todays_meals: "Today's meals",
  meals_label: 'Meals',
  deficit: 'deficit',
  surplus: 'surplus',
  kcal_under_target: 'kcal under target',
  kcal_over_target: 'kcal over target',
  // Analysis
  analysis_btn: 'Analysis',
  analysis_aria: "Analyze today's nutrition",
  nutrition_analysis: 'Nutrition Analysis',
  analyzing_nutrition: 'Analyzing your nutrition…',
  analysis_error: "Couldn't generate analysis right now. Try again in a moment.",
  macro_breakdown: 'Macro breakdown',
  focus_on: 'Focus on',
  what_to_do: 'What to do',
  nutrition_quality: 'Nutrition quality',
  act_now: 'Act now',
  important: 'Important',
  nice_to_have: 'Nice to have',
  // Meal timeline
  nothing_logged: 'Nothing logged yet. Tap + to add your first meal.',
  meal_breakfast: 'Breakfast',
  meal_lunch: 'Lunch',
  meal_dinner: 'Dinner',
  meal_snack: 'Snack',
  // Suggestions
  suggested_meal: 'Suggested next meal',
  refresh_suggestions: 'Refresh suggestions',
  suggestions_error: 'Could not load suggestions',
  log_this: 'Log this →',
  // Meal new/edit
  log_meal: 'Log meal',
  edit_meal: 'Edit meal',
  add_photo: 'Add a photo',
  camera_btn: 'Camera',
  gallery_btn: 'Gallery',
  replace_btn: 'Replace',
  meal_placeholder: "Describe your meal… e.g. '200g grilled chicken, 1 cup brown rice, mixed salad'",
  err_no_meal: 'Add a photo or describe your meal first',
  err_analyze: "We had trouble analyzing that. Try listing ingredients separately, e.g. '200g chicken, 1 cup rice, salad'.",
  err_load_meal: "Couldn't load the original meal.",
  err_analyze_image: "Couldn't analyze the image. You can still describe your meal below.",
  analyzing_meal: 'Analyzing…',
  estimate_nutrition: 'Estimate nutrition',
  re_analyze: 'Re-analyze',
  enter_manually: 'Enter manually',
  ingredient_list_hint: 'Looks like an ingredient list. Each item defaults to 100g — update the amounts to what you actually ate.',
  err_save_meal: "Couldn't save your meal. Your entries are preserved — tap Save to try again.",
  // Meal detail
  ingredients_heading: 'Ingredients',
  edited_badge: 'edited',
  revised_version: 'This is a revised version of an earlier log.',
  view_original: 'View original',
  edit_btn: 'Edit',
  log_again: 'Log again',
  recent_meals: 'Recent meals',
  // Settings
  settings: 'Settings',
  profile_section: 'Profile',
  email_label: 'Email',
  update_profile: 'Update profile',
  current_goal_section: 'Current goal',
  data_section: 'Data',
  data_export_text: 'Data export (JSON/CSV) coming in Phase 3.',
  legal_section: 'Legal',
  terms_link: 'Terms & Conditions',
  privacy_link: 'Privacy Policy',
  // Goal labels
  goalLabel_muscle_gain: 'Muscle Gain / Bulk',
  goalLabel_athlete_cut: 'Athlete Cut',
  goalLabel_weight_loss: 'General Weight Loss',
  goalLabel_maintenance: 'Weight Maintenance',
  goalLabel_recomposition: 'Body Recomposition',
  goalLabel_endurance: 'Endurance Performance',
  goalLabel_heart_healthy: 'Heart Healthy',
  goalLabel_longevity: 'Longevity / Micronutrient Density',
  goalLabel_diabetic: 'Diabetic Management',
  goalLabel_recovery: 'Post-Competition Recovery',
  // Goal descriptions
  goalDesc_muscle_gain: 'Caloric surplus with high protein to maximize muscle growth',
  goalDesc_athlete_cut: 'Preserve muscle while losing fat with precision deficit',
  goalDesc_weight_loss: 'Sustainable caloric deficit for gradual weight loss',
  goalDesc_maintenance: 'Maintain current weight and body composition',
  goalDesc_recomposition: 'Lose fat and gain muscle simultaneously',
  goalDesc_endurance: 'Fuel sustained athletic performance with carbs and hydration',
  goalDesc_heart_healthy: 'Lower blood pressure and cholesterol markers',
  goalDesc_longevity: 'Maximize antioxidants, fiber, and stable blood sugar',
  goalDesc_diabetic: 'Manage glycemic load and blood sugar levels',
  goalDesc_recovery: 'Anti-inflammatory nutrition with protein focus post-competition',
  // Goal focus metrics
  goalFocus_muscle_gain: 'Protein/kg, caloric surplus',
  goalFocus_athlete_cut: 'Protein/kg, caloric deficit',
  goalFocus_weight_loss: 'Calories, caloric deficit',
  goalFocus_maintenance: 'Caloric balance',
  goalFocus_recomposition: 'P/C/F ratio + calories',
  goalFocus_endurance: 'Carbs, hydration',
  goalFocus_heart_healthy: 'Sodium, saturated fat',
  goalFocus_longevity: 'Fiber, sugar, micronutrients',
  goalFocus_diabetic: 'Net carbs, sugar',
  goalFocus_recovery: 'Protein, anti-inflammatory',
  // Activity labels
  actLabel_sedentary: 'Sedentary',
  actLabel_light: 'Lightly Active',
  actLabel_moderate: 'Moderately Active',
  actLabel_very_active: 'Very Active',
  actLabel_athlete: 'Competitive Athlete',
  // Activity descriptions
  actDesc_sedentary: 'Little or no exercise, desk job',
  actDesc_light: 'Light exercise 1–3 days/week',
  actDesc_moderate: 'Moderate exercise 3–5 days/week',
  actDesc_very_active: 'Hard exercise 6–7 days/week',
  actDesc_athlete: 'Very hard exercise, physical job, or twice-daily training',
  // Dietary preferences
  pref_None: 'None',
  pref_Vegetarian: 'Vegetarian',
  pref_Vegan: 'Vegan',
  pref_Keto: 'Keto',
  pref_Paleo: 'Paleo',
  pref_Mediterranean: 'Mediterranean',
  pref_Gluten_Free: 'Gluten-Free',
  pref_Dairy_Free: 'Dairy-Free',
  pref_Low_FODMAP: 'Low-FODMAP',
  // Date labels
  date_today: 'Today',
  date_yesterday: 'Yesterday',
  // Filter tabs
  filter_day: 'Day',
  filter_7d: '7D',
  filter_30d: '30D',
  filter_custom: 'Custom',
  // Verification card
  review_ingredients: 'Review ingredients',
  start_over: 'Start over',
  ingredient_name_placeholder: 'Ingredient name',
  qty_auto: 'QTY',
  file_btn: 'File',
  scan_label_title: 'Scan ingredient label',
  scanning_label: 'Scanning label…',
  estimating_nutrition: 'Estimating nutrition…',
  col_amt: 'Amt',
  col_prot_g: 'Prot g',
  col_carbs_g: 'Carbs g',
  col_fat_g: 'Fat g',
  add_ingredient: 'Add ingredient',
  col_cal: 'Cal',
  must_fill_quantity: 'Must fill out quantity of item',
  saving: 'Saving…',
  // Macro breakdown dialog
  breakdown_suffix: 'breakdown',
  consumed_label: 'consumed',
  goal_word: 'goal',
  quality_breakdown: 'Quality breakdown',
  fiber_complex: 'Fiber (complex)',
  fiber_desc: 'slows digestion, feeds gut bacteria',
  sugar_simple: 'Sugar (simple)',
  sugar_desc: 'fast-digesting, watch for spikes',
  no_fiber_sugar_data: 'No fiber or sugar data for logged items.',
  saturated_label: 'Saturated',
  saturated_desc: 'limit — raises LDL cholesterol',
  unsaturated_label: 'Unsaturated',
  unsaturated_desc: 'heart-healthy (mono & poly)',
  sodium_macro_label: 'Sodium',
  sodium_daily_limit: 'daily limit ~2300mg',
  pct_of_limit: '% of limit',
  fiber_from_protein: 'Fiber (from protein foods)',
  fiber_goal_note: 'goal ~25–38g/day',
  no_data_logged: 'No data logged yet.',
  pct_of_meal: '% of meal',
  total_label: 'Total',
  pct_of_goal: '% of goal',
  // Calendar
  select_end_date: 'Now select an end date',
  // Confidence
  confidence_high: 'High confidence',
  confidence_medium: 'Medium confidence',
  confidence_low: 'Low confidence',
  // Goal switcher
  goal_section_label: 'Goal',
  // Daily menu
  daily_menu_title: 'Daily Menu Plan',
  generate_daily_menu: 'Suggest a full-day menu based on your habits',
  generating_menu: 'Building your personalized menu…',
  menu_error: 'Could not generate menu',
  menu_not_ready_title: 'Keep logging meals to unlock your personalized daily menu',
  days_logged: 'days logged',
  refresh_menu: 'Refresh menu',
  day_total: 'Day total',
  // Units
  unit_kcal: 'kcal',
} as const

const he: Translations = {
  // Common
  back: 'חזרה',
  next: 'הבא',
  save: 'שמור',
  cancel: 'ביטול',
  add: 'הוסף',
  skip: 'דלג',
  try_again: 'נסה שוב',
  optional: 'אופציונלי',
  // Language
  lang_en: 'English',
  lang_he: 'עברית',
  // Nav
  nav_today: 'היום',
  nav_log: 'רשום',
  nav_weekly: 'שבועי',
  nav_settings: 'הגדרות',
  // Auth
  sign_in: 'כניסה',
  sign_up: 'הרשמה',
  sign_in_subtitle: 'התחבר כדי לעקוב אחר התזונה שלך',
  create_account: 'יצירת חשבון',
  create_account_subtitle: 'התחל לעקוב אחר התזונה שלך היום',
  continue_google: 'המשך עם Google',
  continue_microsoft: 'המשך עם Microsoft',
  or_divider: 'או',
  email_field: 'אימייל',
  password_field: 'סיסמה',
  confirm_password: 'אמת סיסמה',
  signing_in: 'מתחבר...',
  creating_account: 'יוצר חשבון...',
  redirecting: 'מעביר...',
  no_account: 'אין חשבון?',
  already_account: 'כבר יש לך חשבון?',
  err_oauth: 'כניסה דרך OAuth נכשלה. אנא נסה שוב.',
  err_passwords_mismatch: 'הסיסמאות אינן תואמות',
  err_password_short: 'הסיסמה חייבת להכיל לפחות 8 תווים',
  forgot_password: 'שכחת סיסמה?',
  forgot_password_title: 'איפוס סיסמה',
  forgot_password_subtitle: 'הכנס את האימייל שלך ונשלח לך קישור לאיפוס',
  send_reset_link: 'שלח קישור לאיפוס',
  sending_reset: 'שולח…',
  reset_link_sent: 'בדוק את האימייל שלך לקישור לאיפוס סיסמה.',
  reset_password_title: 'הגדר סיסמה חדשה',
  new_password_field: 'סיסמה חדשה',
  update_password: 'עדכן סיסמה',
  updating_password: 'מעדכן…',
  password_updated: 'הסיסמה עודכנה! מתחבר…',
  back_to_sign_in: 'חזרה להתחברות',
  // Onboarding - About You
  about_you: 'עליך',
  about_you_subtitle: 'הנתונים שלך והעדפות תזונה',
  height: 'גובה',
  weight: 'משקל',
  age: 'גיל',
  sex: 'מין',
  sex_male: 'זכר',
  sex_female: 'נקבה',
  diet_label: 'תזונה',
  allergies_label: 'אלרגיות',
  allergy_placeholder: 'לדוגמה: בוטנים, סוכרת',
  start: 'התחל',
  err_height: 'הכנס גובה תקין (50–300 ס"מ)',
  err_weight: 'הכנס משקל תקין',
  err_age: 'הכנס גיל תקין (1–120)',
  // Onboarding - Activity
  activity_level: 'רמת פעילות',
  activity_subtitle: 'כמה אתה פעיל בשבוע טיפוסי?',
  // Onboarding - Goal
  your_goal: 'המטרה שלך',
  goal_subtitle: 'נתאים את היעדים שלך בהתאם',
  finalize: 'סיים',
  focus_prefix: 'מיקוד: ',
  // Onboarding - Preferences
  your_preferences: 'ההעדפות שלך',
  preferences_subtitle: 'מסייע בהתאמה אישית של הצעות הארוחה',
  dietary_preferences: 'העדפות תזונה',
  allergies_exclusions: 'אלרגיות / הגבלות בריאות',
  meals_per_day: 'ארוחות טיפוסיות ביום',
  // Onboarding - Review
  your_targets: 'היעדים שלך',
  personalized_for: 'מותאם אישית עבור',
  daily_calories: 'קלוריות יומיות',
  protein: 'חלבון',
  carbohydrates: 'פחמימות',
  fat_label: 'שומן',
  fiber: 'סיבים',
  water: 'מים',
  setting_up: 'מגדיר...',
  start_tracking: 'התחל מעקב',
  calculating_targets: 'מחשב את היעדים שלך...',
  err_calculate_targets: 'חישוב היעדים נכשל. אנא נסה שוב.',
  // Dashboard
  remaining_today: 'נותר להיום',
  calories: 'קלוריות',
  carbs: 'פחמימות',
  fat: 'שומן',
  todays_meals: 'ארוחות היום',
  meals_label: 'ארוחות',
  deficit: 'גירעון',
  surplus: 'עודף',
  kcal_under_target: "קל' מתחת ליעד",
  kcal_over_target: "קל' מעל ליעד",
  // Analysis
  analysis_btn: 'ניתוח',
  analysis_aria: 'נתח את תזונת היום',
  nutrition_analysis: 'ניתוח תזונתי',
  analyzing_nutrition: 'מנתח את התזונה שלך...',
  analysis_error: 'לא הצלחנו לייצר ניתוח כרגע. נסה שוב בעוד רגע.',
  macro_breakdown: 'פירוט מאקרו',
  focus_on: 'התמקד ב',
  what_to_do: 'מה לעשות',
  nutrition_quality: 'איכות תזונתית',
  act_now: 'פעל עכשיו',
  important: 'חשוב',
  nice_to_have: 'מומלץ',
  // Meal timeline
  nothing_logged: 'טרם נרשמה ארוחה. לחץ + להוספת ארוחה ראשונה.',
  meal_breakfast: 'ארוחת בוקר',
  meal_lunch: 'ארוחת צהריים',
  meal_dinner: 'ארוחת ערב',
  meal_snack: 'חטיף',
  // Suggestions
  suggested_meal: 'ארוחה מומלצת הבאה',
  refresh_suggestions: 'רענן הצעות',
  suggestions_error: 'לא ניתן לטעון הצעות',
  log_this: 'רשום ←',
  // Meal new/edit
  log_meal: 'רשום ארוחה',
  edit_meal: 'ערוך ארוחה',
  add_photo: 'הוסף תמונה',
  camera_btn: 'מצלמה',
  gallery_btn: 'גלריה',
  replace_btn: 'החלף',
  meal_placeholder: "תאר את הארוחה... לדוגמה: '200 גרם עוף צלוי, כוס אורז מלא, סלט מעורב'",
  err_no_meal: 'הוסף תמונה או תאר את הארוחה תחילה',
  err_analyze: 'היה לנו קושי לנתח זאת. נסה לרשום מרכיבים בנפרד.',
  err_load_meal: 'לא הצלחנו לטעון את הארוחה המקורית.',
  err_analyze_image: 'לא הצלחנו לנתח את התמונה. תוכל לתאר את הארוחה למטה.',
  analyzing_meal: 'מנתח...',
  estimate_nutrition: 'הערך תזונה',
  re_analyze: 'נתח מחדש',
  enter_manually: 'הכנס ידנית',
  ingredient_list_hint: 'נראה כרשימת מרכיבים. כל פריט ברירת מחדל 100 גרם — עדכן את הכמויות שאכלת בפועל.',
  err_save_meal: 'לא הצלחנו לשמור את הארוחה. הנתונים שמורים — לחץ שמור לנסות שוב.',
  // Meal detail
  ingredients_heading: 'מרכיבים',
  edited_badge: 'נערך',
  revised_version: 'זהו גרסה מתוקנת של רישום קודם.',
  view_original: 'צפה במקורי',
  edit_btn: 'ערוך',
  log_again: 'רשום שוב',
  recent_meals: 'ארוחות אחרונות',
  // Settings
  settings: 'הגדרות',
  profile_section: 'פרופיל',
  email_label: 'אימייל',
  update_profile: 'עדכן פרופיל',
  current_goal_section: 'מטרה נוכחית',
  data_section: 'נתונים',
  data_export_text: 'ייצוא נתונים (JSON/CSV) יגיע בשלב 3.',
  legal_section: 'משפטי',
  terms_link: 'תנאי שימוש',
  privacy_link: 'מדיניות פרטיות',
  // Goal labels
  goalLabel_muscle_gain: 'עלייה במסת שריר',
  goalLabel_athlete_cut: 'חיתוך ספורטיבי',
  goalLabel_weight_loss: 'ירידה במשקל',
  goalLabel_maintenance: 'שמירת משקל',
  goalLabel_recomposition: 'שיפור הרכב גוף',
  goalLabel_endurance: 'ביצועי סיבולת',
  goalLabel_heart_healthy: 'בריאות הלב',
  goalLabel_longevity: 'אריכות חיים / צפיפות מיקרואלמנטים',
  goalLabel_diabetic: 'ניהול סוכרת',
  goalLabel_recovery: 'התאוששות לאחר תחרות',
  // Goal descriptions
  goalDesc_muscle_gain: 'עודף קלורי עם חלבון גבוה למיצוי גדילת שרירים',
  goalDesc_athlete_cut: 'שמירת שריר תוך ירידה בשומן עם גירעון מדויק',
  goalDesc_weight_loss: 'גירעון קלורי בר-קיימא לירידה הדרגתית במשקל',
  goalDesc_maintenance: 'שמירת המשקל הנוכחי והרכב הגוף',
  goalDesc_recomposition: 'ירידה בשומן ועלייה בשריר בו-זמנית',
  goalDesc_endurance: 'תדלוק לביצועים ספורטיביים עם פחמימות והידרציה',
  goalDesc_heart_healthy: 'הורדת לחץ דם וכולסטרול',
  goalDesc_longevity: 'מיצוי נוגדי חמצון, סיבים וסוכר יציב בדם',
  goalDesc_diabetic: 'ניהול עומס גליקמי ורמות סוכר בדם',
  goalDesc_recovery: 'תזונה אנטי-דלקתית עם דגש על חלבון לאחר תחרות',
  // Goal focus metrics
  goalFocus_muscle_gain: 'חלבון/ק"ג, עודף קלורי',
  goalFocus_athlete_cut: 'חלבון/ק"ג, גירעון קלורי',
  goalFocus_weight_loss: 'קלוריות, גירעון קלורי',
  goalFocus_maintenance: 'איזון קלורי',
  goalFocus_recomposition: 'יחס ח/פ/ש + קלוריות',
  goalFocus_endurance: 'פחמימות, הידרציה',
  goalFocus_heart_healthy: 'נתרן, שומן רווי',
  goalFocus_longevity: 'סיבים, סוכר, מיקרואלמנטים',
  goalFocus_diabetic: 'פחמימות נטו, סוכר',
  goalFocus_recovery: 'חלבון, אנטי-דלקתי',
  // Activity labels
  actLabel_sedentary: 'יושבני',
  actLabel_light: 'פעיל מעט',
  actLabel_moderate: 'פעיל בינוני',
  actLabel_very_active: 'פעיל מאוד',
  actLabel_athlete: 'ספורטאי תחרותי',
  // Activity descriptions
  actDesc_sedentary: 'מעט מאוד פעילות גופנית, עבודת משרד',
  actDesc_light: 'פעילות קלה 1–3 ימים בשבוע',
  actDesc_moderate: 'פעילות בינונית 3–5 ימים בשבוע',
  actDesc_very_active: 'פעילות אינטנסיבית 6–7 ימים בשבוע',
  actDesc_athlete: 'פעילות קשה מאוד, עבודה פיזית, או אימונים פעמיים ביום',
  // Dietary preferences
  pref_None: 'ללא',
  pref_Vegetarian: 'צמחוני',
  pref_Vegan: 'טבעוני',
  pref_Keto: 'קטו',
  pref_Paleo: 'פליאו',
  pref_Mediterranean: 'ים תיכוני',
  pref_Gluten_Free: 'ללא גלוטן',
  pref_Dairy_Free: 'ללא חלב',
  pref_Low_FODMAP: 'Low-FODMAP',
  // Date labels
  date_today: 'היום',
  date_yesterday: 'אתמול',
  // Filter tabs
  filter_day: 'יום',
  filter_7d: '7',
  filter_30d: '30',
  filter_custom: 'מותאם',
  // Verification card
  review_ingredients: 'סקירת מרכיבים',
  start_over: 'התחל מחדש',
  ingredient_name_placeholder: 'שם המרכיב',
  qty_auto: 'כמות',
  file_btn: 'קובץ',
  scan_label_title: 'סרוק תווית מרכיב',
  scanning_label: 'סורק תווית…',
  estimating_nutrition: 'מעריך תזונה…',
  col_amt: 'כמות',
  col_prot_g: "חלב ג'",
  col_carbs_g: "פחמ ג'",
  col_fat_g: "שומן ג'",
  add_ingredient: 'הוסף מרכיב',
  col_cal: "קל'",
  must_fill_quantity: 'חובה למלא כמות לכל פריט',
  saving: 'שומר…',
  // Macro breakdown dialog
  breakdown_suffix: 'פירוט',
  consumed_label: 'נצרך',
  goal_word: 'יעד',
  quality_breakdown: 'פירוט איכות',
  fiber_complex: 'סיבים (מורכבים)',
  fiber_desc: 'מאט עיכול, מזין חיידקי מעי',
  sugar_simple: 'סוכר (פשוט)',
  sugar_desc: 'עיכול מהיר, שים לב לקפיצות',
  no_fiber_sugar_data: 'אין נתוני סיבים וסוכר לפריטים שנרשמו.',
  saturated_label: 'שומן רווי',
  saturated_desc: 'הגבל — מעלה כולסטרול LDL',
  unsaturated_label: 'שומן בלתי רווי',
  unsaturated_desc: 'בריא ללב (חד ורב)',
  sodium_macro_label: 'נתרן',
  sodium_daily_limit: 'מגבלה יומית ~2300מ"ג',
  pct_of_limit: '% מהמגבלה',
  fiber_from_protein: 'סיבים (ממזונות חלבון)',
  fiber_goal_note: "יעד ~25–38 ג' ליום",
  no_data_logged: 'אין נתונים עדיין.',
  pct_of_meal: '% מהארוחה',
  total_label: 'סה"כ',
  pct_of_goal: '% מהיעד',
  // Calendar
  select_end_date: 'כעת בחר תאריך סיום',
  // Confidence
  confidence_high: 'ביטחון גבוה',
  confidence_medium: 'ביטחון בינוני',
  confidence_low: 'ביטחון נמוך',
  // Goal switcher
  goal_section_label: 'מטרה',
  // Daily menu
  daily_menu_title: 'תפריט יומי',
  generate_daily_menu: 'הצע תפריט יום שלם בהתאם להרגלים שלך',
  generating_menu: 'בונה את התפריט האישי שלך…',
  menu_error: 'לא הצלחנו ליצור תפריט',
  menu_not_ready_title: 'המשך לרשום ארוחות לפתיחת התפריט היומי האישי',
  days_logged: 'ימים נרשמו',
  refresh_menu: 'רענן תפריט',
  day_total: 'סה"כ יומי',
  // Units
  unit_kcal: "קל'",
}

export type Translations = { [K in keyof typeof en]: string }
export type Lang = 'en' | 'he'

const translations: Record<Lang, Translations> = { en, he }

// ─── Context ─────────────────────────────────────────────────────────────────

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
})

// ─── Provider ────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  // Initialise from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lang')
    if (stored === 'en' || stored === 'he') setLangState(stored)
  }, [])

  // Update document attributes + persist whenever lang changes
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
    localStorage.setItem('lang', lang)
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLanguage() {
  const { lang, setLang } = useContext(LanguageContext)
  const t = translations[lang]
  return { lang, setLang, t }
}

// ─── Language Switcher ────────────────────────────────────────────────────────

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const label = lang === 'he' ? 'עב' : 'EN'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Switch language"
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[110px] rounded-lg border border-border bg-popover shadow-md py-1">
          <button
            type="button"
            onClick={() => { setLang('en'); setOpen(false) }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${lang === 'en' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
          >
            {t.lang_en}
          </button>
          <button
            type="button"
            onClick={() => { setLang('he'); setOpen(false) }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${lang === 'he' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
          >
            {t.lang_he}
          </button>
        </div>
      )}
    </div>
  )
}
