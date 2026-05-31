
/*
  # Fitness App Core Schema

  ## Overview
  Sets up the core database schema for a commercial fitness tracking application.

  ## New Tables

  ### 1. `user_profiles`
  Stores each user's physical measurements, preferences, and goals.
  - `id` - Primary key (UUID)
  - `user_id` - References auth.users, links profile to authenticated user
  - `name` - Display name
  - `age` - User's age in years
  - `gender` - 'male', 'female', or 'other'
  - `height_cm` - Height in centimeters
  - `weight_kg` - Weight in kilograms
  - `activity_level` - One of: sedentary, light, moderate, active, very_active
  - `dietary_preference` - One of: veg, non_veg, vegan, keto
  - `goal` - One of: lose, maintain, gain
  - Timestamps for record tracking

  ### 2. `food_items`
  Comprehensive food database with nutritional information and dietary tags.
  - `id` - Primary key (UUID)
  - `name` - Food name
  - `calories` - Calories per 100g
  - `protein_g` - Protein grams per 100g
  - `carbs_g` - Carbohydrates grams per 100g
  - `fat_g` - Fat grams per 100g
  - `is_veg` - Suitable for vegetarians
  - `is_vegan` - Suitable for vegans
  - `is_non_veg` - Contains meat/fish/poultry
  - `is_keto` - Keto-friendly (low carb)
  - `meal_type` - breakfast, lunch, dinner, or snack
  - `category` - protein, carbs, fat, or vegetables
  - `serving_g` - Typical serving size in grams

  ## Security
  - RLS enabled on user_profiles (users can only access their own data)
  - food_items is publicly readable (no sensitive data)
  - Separate policies for SELECT, INSERT, UPDATE, DELETE

  ## Notes
  1. food_items table is seeded with ~40 common foods spanning all dietary categories
  2. user_profiles uses auth.uid() for strict ownership enforcement
*/

-- USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT '',
  age integer CHECK (age > 0 AND age < 150),
  gender text NOT NULL DEFAULT 'other' CHECK (gender IN ('male', 'female', 'other')),
  height_cm numeric NOT NULL CHECK (height_cm > 50 AND height_cm < 300),
  weight_kg numeric NOT NULL CHECK (weight_kg > 10 AND weight_kg < 500),
  activity_level text NOT NULL DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  dietary_preference text NOT NULL DEFAULT 'non_veg' CHECK (dietary_preference IN ('veg', 'non_veg', 'vegan', 'keto')),
  goal text NOT NULL DEFAULT 'maintain' CHECK (goal IN ('lose', 'maintain', 'gain')),
  training_mode text NOT NULL DEFAULT 'power' CHECK (training_mode IN ('power', 'endurance', 'recovery')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- FOOD ITEMS TABLE
CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  calories numeric NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  is_veg boolean NOT NULL DEFAULT false,
  is_vegan boolean NOT NULL DEFAULT false,
  is_non_veg boolean NOT NULL DEFAULT false,
  is_keto boolean NOT NULL DEFAULT false,
  meal_type text NOT NULL DEFAULT 'lunch' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  category text NOT NULL DEFAULT 'protein' CHECK (category IN ('protein', 'carbs', 'fat', 'vegetables')),
  serving_g numeric NOT NULL DEFAULT 100
);

ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Food items are publicly readable"
  ON food_items FOR SELECT
  TO anon, authenticated
  USING (id IS NOT NULL);

-- SEED FOOD DATABASE
INSERT INTO food_items (name, calories, protein_g, carbs_g, fat_g, is_veg, is_vegan, is_non_veg, is_keto, meal_type, category, serving_g) VALUES

-- NON-VEG PROTEINS
('Chicken Breast (Grilled)', 165, 31, 0, 3.6, false, false, true, true, 'lunch', 'protein', 150),
('Salmon Fillet', 208, 20, 0, 13, false, false, true, true, 'dinner', 'protein', 150),
('Whole Eggs', 155, 13, 1.1, 11, true, false, false, false, 'breakfast', 'protein', 100),
('Egg Whites', 52, 11, 0.7, 0.2, true, false, false, true, 'breakfast', 'protein', 100),
('Tuna (in water)', 116, 26, 0, 1, false, false, true, true, 'lunch', 'protein', 100),
('Turkey Breast', 135, 30, 0, 1, false, false, true, true, 'dinner', 'protein', 150),
('Lean Ground Beef (90%)', 215, 26, 0, 12, false, false, true, true, 'dinner', 'protein', 150),
('Shrimp', 99, 24, 0.2, 0.3, false, false, true, true, 'lunch', 'protein', 100),
('Greek Yogurt (Plain)', 59, 10, 3.6, 0.4, true, false, false, false, 'breakfast', 'protein', 200),
('Cottage Cheese', 98, 11, 3.4, 4.3, true, false, false, false, 'snack', 'protein', 150),

-- VEG / VEGAN PROTEINS
('Lentils (Cooked)', 116, 9, 20, 0.4, true, true, false, false, 'lunch', 'protein', 180),
('Chickpeas (Cooked)', 164, 9, 27, 2.6, true, true, false, false, 'lunch', 'protein', 150),
('Black Beans', 132, 8.9, 24, 0.5, true, true, false, false, 'dinner', 'protein', 170),
('Tofu (Firm)', 144, 17, 3, 9, true, true, false, true, 'lunch', 'protein', 150),
('Tempeh', 193, 20, 7.6, 11, true, true, false, true, 'dinner', 'protein', 100),
('Edamame', 121, 11, 8.9, 5.2, true, true, false, false, 'snack', 'protein', 150),
('Paneer (Indian Cheese)', 265, 18, 3.5, 21, true, false, false, true, 'lunch', 'protein', 100),
('Hemp Seeds', 553, 31, 8.7, 49, true, true, false, true, 'breakfast', 'protein', 30),

-- COMPLEX CARBS (Veg/Vegan)
('Brown Rice (Cooked)', 216, 5, 45, 1.8, true, true, false, false, 'lunch', 'carbs', 195),
('Rolled Oats (Dry)', 389, 17, 66, 7, true, true, false, false, 'breakfast', 'carbs', 80),
('Quinoa (Cooked)', 222, 8, 39, 3.5, true, true, false, false, 'lunch', 'carbs', 185),
('Sweet Potato', 86, 1.6, 20, 0.1, true, true, false, false, 'dinner', 'carbs', 130),
('Banana', 89, 1.1, 23, 0.3, true, true, false, false, 'snack', 'carbs', 120),
('Whole Wheat Bread', 247, 13, 41, 4.2, true, true, false, false, 'breakfast', 'carbs', 60),
('Basmati Rice (Cooked)', 150, 3.5, 32, 0.4, true, true, false, false, 'dinner', 'carbs', 180),

-- VEGETABLES
('Broccoli', 34, 2.8, 6.6, 0.4, true, true, false, true, 'lunch', 'vegetables', 150),
('Spinach', 23, 2.9, 3.6, 0.4, true, true, false, true, 'lunch', 'vegetables', 100),
('Kale', 49, 4.3, 8.8, 0.9, true, true, false, true, 'dinner', 'vegetables', 100),
('Avocado', 160, 2, 8.5, 15, true, true, false, true, 'breakfast', 'fat', 100),
('Mixed Greens Salad', 20, 1.8, 3.1, 0.3, true, true, false, true, 'lunch', 'vegetables', 150),
('Bell Peppers (Mixed)', 31, 1, 6, 0.3, true, true, false, true, 'snack', 'vegetables', 120),
('Cauliflower', 25, 1.9, 5, 0.3, true, true, false, true, 'dinner', 'vegetables', 150),
('Zucchini', 17, 1.2, 3.1, 0.3, true, true, false, true, 'dinner', 'vegetables', 150),

-- HEALTHY FATS
('Almonds', 579, 21, 22, 50, true, true, false, true, 'snack', 'fat', 30),
('Walnuts', 654, 15, 14, 65, true, true, false, true, 'snack', 'fat', 30),
('Olive Oil', 884, 0, 0, 100, true, true, false, true, 'lunch', 'fat', 15),
('Peanut Butter (Natural)', 588, 25, 20, 50, true, true, false, true, 'breakfast', 'fat', 32),
('Chia Seeds', 486, 17, 42, 31, true, true, false, false, 'breakfast', 'fat', 30),
('Flaxseeds', 534, 18, 29, 42, true, true, false, true, 'breakfast', 'fat', 30),

-- KETO SPECIFIC
('Bacon (Turkey)', 218, 29, 1.4, 12, false, false, true, true, 'breakfast', 'protein', 100),
('Macadamia Nuts', 718, 8, 14, 76, true, true, false, true, 'snack', 'fat', 30),
('Brie Cheese', 334, 21, 0.5, 28, true, false, false, true, 'snack', 'fat', 50);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
