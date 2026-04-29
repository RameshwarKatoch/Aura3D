-- ADD INDIAN VEG PROTEINS
INSERT INTO food_items (name, calories, protein_g, carbs_g, fat_g, is_veg, is_vegan, is_non_veg, is_keto, meal_type, category, serving_g) VALUES
('Paneer Tikka (Grilled)', 220, 16, 6, 14, true, false, false, true, 'lunch', 'protein', 150),
('Dal Tadka (Yellow Lentils)', 120, 7, 18, 3, true, true, false, false, 'lunch', 'protein', 200),
('Chana Masala (Chickpeas)', 160, 8, 25, 4, true, true, false, false, 'dinner', 'protein', 200),
('Rajma Masala (Kidney Beans)', 140, 9, 22, 2.5, true, true, false, false, 'lunch', 'protein', 200),
('Palak Paneer', 190, 12, 8, 13, true, false, false, false, 'dinner', 'protein', 200),
('Moong Dal Chilka', 105, 8, 16, 1.5, true, true, false, false, 'lunch', 'protein', 200),
('Soya Chaap (Roasted)', 180, 15, 12, 8, true, true, false, false, 'snack', 'protein', 150),
('Sprouted Moong Salad', 110, 9, 18, 0.5, true, true, false, false, 'snack', 'protein', 150);

-- ADD INDIAN NON-VEG PROTEINS
INSERT INTO food_items (name, calories, protein_g, carbs_g, fat_g, is_veg, is_vegan, is_non_veg, is_keto, meal_type, category, serving_g) VALUES
('Chicken Tikka (Tandoori)', 150, 26, 2, 4, false, false, true, true, 'lunch', 'protein', 150),
('Chicken Curry (Home Style)', 180, 22, 5, 8, false, false, true, false, 'dinner', 'protein', 200),
('Fish Amritsari (Grilled)', 160, 24, 4, 6, false, false, true, true, 'dinner', 'protein', 150),
('Mutton Rogan Josh', 280, 24, 6, 18, false, false, true, false, 'dinner', 'protein', 200),
('Egg Bhurji (Indian Scramble)', 160, 13, 3, 11, true, false, false, true, 'breakfast', 'protein', 150),
('Prawn Masala', 140, 22, 4, 3.5, false, false, true, true, 'lunch', 'protein', 150);

-- ADD INDIAN CARBS
INSERT INTO food_items (name, calories, protein_g, carbs_g, fat_g, is_veg, is_vegan, is_non_veg, is_keto, meal_type, category, serving_g) VALUES
('Whole Wheat Roti', 120, 4, 25, 0.5, true, true, false, false, 'lunch', 'carbs', 40),
('Missi Roti (Gram Flour)', 150, 7, 26, 2, true, true, false, false, 'lunch', 'carbs', 50),
('Bajra Roti (Pearl Millet)', 135, 4.5, 28, 1.5, true, true, false, false, 'dinner', 'carbs', 50),
('Masala Dosa', 180, 4, 35, 4, true, true, false, false, 'breakfast', 'carbs', 150),
('Idli (Rice & Lentil Cake)', 60, 2, 12, 0.1, true, true, false, false, 'breakfast', 'carbs', 40),
('Vegetable Pulao', 160, 4, 32, 2.5, true, true, false, false, 'lunch', 'carbs', 200),
('Sabudana Khichdi', 190, 2, 45, 1, true, true, false, false, 'breakfast', 'carbs', 150);

-- ADD INDIAN VEGETABLES & SIDES
INSERT INTO food_items (name, calories, protein_g, carbs_g, fat_g, is_veg, is_vegan, is_non_veg, is_keto, meal_type, category, serving_g) VALUES
('Bhindi Masala (Okra)', 90, 2, 12, 4, true, true, false, false, 'lunch', 'vegetables', 150),
('Baingan Bharta', 110, 2, 14, 6, true, true, false, false, 'dinner', 'vegetables', 200),
('Aloo Gobi', 140, 3, 22, 5, true, true, false, false, 'lunch', 'vegetables', 200),
('Mixed Vegetable Sabzi', 110, 3, 18, 4, true, true, false, false, 'dinner', 'vegetables', 200),
('Cucumber Raita', 45, 3, 4, 2, true, false, false, false, 'lunch', 'vegetables', 100);
