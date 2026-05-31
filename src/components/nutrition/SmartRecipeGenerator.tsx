import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Utensils, Zap, Flame, Droplets, Info, Sparkles, ChefHat } from 'lucide-react';
import type { Recipe, DietaryPreference } from '../../types';
import FoodPlate3D from './FoodPlate3D';

interface Props {
  dietaryPreference: DietaryPreference;
}

const ALL_RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'High-Protein Paneer Stir-fry',
    ingredients: ['Paneer', 'Bell Peppers', 'Broccoli', 'Soy Sauce', 'Ginger'],
    macros: { protein: 28, carbs: 12, fat: 18, calories: 320 },
    isVeg: true,
    instructions: ['Dice paneer and veggies.', 'Sauté ginger and peppers.', 'Add paneer and broccoli.', 'Finish with soy sauce.'],
    proteinSource: 'Paneer (200g)',
    icon: '🥗'
  },
  {
    id: '2',
    name: 'Quinoa Lentil Power Bowl',
    ingredients: ['Quinoa', 'Lentils', 'Spinach', 'Lemon', 'Tofu'],
    macros: { protein: 26, carbs: 45, fat: 8, calories: 360 },
    isVeg: true,
    instructions: ['Cook quinoa and lentils.', 'Mix with fresh spinach.', 'Add grilled tofu cubes.', 'Squeeze fresh lemon.'],
    proteinSource: 'Tofu & Lentils',
    icon: '🥣'
  },
  {
    id: '3',
    name: 'Grilled Lemon Chicken',
    ingredients: ['Chicken Breast', 'Lemon', 'Asparagus', 'Garlic', 'Olive Oil'],
    macros: { protein: 32, carbs: 5, fat: 10, calories: 240 },
    isVeg: false,
    instructions: ['Marinate chicken in lemon and garlic.', 'Grill asparagus for 5 mins.', 'Sear chicken until golden.', 'Serve warm.'],
    proteinSource: 'Chicken Breast (150g)',
    icon: '🍗'
  },
  {
    id: '4',
    name: 'Egg White & Turkey Scramble',
    ingredients: ['Egg Whites', 'Turkey Breast', 'Spinach', 'Onion', 'Oats'],
    macros: { protein: 35, carbs: 20, fat: 6, calories: 280 },
    isVeg: false,
    instructions: ['Whisk egg whites.', 'Sauté turkey and onions.', 'Add spinach and eggs.', 'Serve with a side of oats.'],
    proteinSource: 'Egg Whites & Turkey',
    icon: '🍳'
  },
  {
    id: '5',
    name: 'Soya Chunk Masala',
    ingredients: ['Soya Chunks', 'Tomato', 'Onion', 'Greek Yogurt', 'Spices', 'Coriander'],
    macros: { protein: 30, carbs: 15, fat: 7, calories: 250 },
    isVeg: true,
    instructions: ['Boil soya chunks.', 'Prepare tomato-onion gravy.', 'Fold in yogurt and chunks.', 'Garnish with coriander.'],
    proteinSource: 'Soya Chunks',
    icon: '🥘'
  },
  {
    id: '6',
    name: 'Salmon & Avocado Mash',
    ingredients: ['Salmon', 'Avocado', 'Cucumber', 'Lime', 'Chicken'],
    macros: { protein: 27, carbs: 8, fat: 22, calories: 340 },
    isVeg: false,
    instructions: ['Grill salmon fillet.', 'Mash avocado with lime.', 'Slice cucumbers.', 'Plate everything together.'],
    proteinSource: 'Salmon Fillet',
    icon: '🐟'
  },
  {
    id: '7',
    name: 'Palak Paneer',
    ingredients: ['Paneer', 'Spinach', 'Tomato', 'Onion', 'Garlic', 'Garam Masala'],
    macros: { protein: 22, carbs: 14, fat: 18, calories: 290 },
    isVeg: true,
    instructions: ['Blanch and puree spinach.', 'Sauté onions, garlic, and tomatoes.', 'Add spices and spinach puree.', 'Simmer with paneer cubes.'],
    proteinSource: 'Paneer (150g)',
    icon: '🍲'
  },
  {
    id: '8',
    name: 'Chicken Tikka Masala',
    ingredients: ['Chicken Breast', 'Tomato', 'Onion', 'Greek Yogurt', 'Spices'],
    macros: { protein: 34, carbs: 12, fat: 14, calories: 310 },
    isVeg: false,
    instructions: ['Marinate chicken in yogurt and spices.', 'Grill chicken pieces.', 'Simmer in tomato gravy.', 'Serve hot.'],
    proteinSource: 'Chicken Breast (200g)',
    icon: '🍛'
  },
  {
    id: '9',
    name: 'Moong Dal Chilla',
    ingredients: ['Moong Dal', 'Onion', 'Green Chili', 'Coriander'],
    macros: { protein: 18, carbs: 32, fat: 4, calories: 220 },
    isVeg: true,
    instructions: ['Soak and blend moong dal into batter.', 'Mix in chopped veggies.', 'Cook like pancakes on a skillet.', 'Serve with mint chutney.'],
    proteinSource: 'Moong Dal',
    icon: '🥞'
  },
  {
    id: '10',
    name: 'Egg Curry',
    ingredients: ['Eggs', 'Tomato', 'Onion', 'Garlic', 'Spices'],
    macros: { protein: 24, carbs: 10, fat: 16, calories: 260 },
    isVeg: false,
    instructions: ['Hard boil eggs and peel.', 'Prepare spicy tomato-onion base.', 'Add eggs and simmer.', 'Garnish with cilantro.'],
    proteinSource: 'Eggs (4 whole)',
    icon: '🥚'
  },
  {
    id: '11',
    name: 'Chana Masala',
    ingredients: ['Chickpeas', 'Tomato', 'Onion', 'Ginger', 'Chana Masala Spice'],
    macros: { protein: 15, carbs: 40, fat: 6, calories: 280 },
    isVeg: true,
    instructions: ['Soak and boil chickpeas.', 'Cook onion-tomato masala base.', 'Add chickpeas and simmer.', 'Serve with a squeeze of lemon.'],
    proteinSource: 'Chickpeas (1 cup)',
    icon: '🥙'
  },
  {
    id: '12',
    name: 'Tandoori Chicken Bowl',
    ingredients: ['Chicken', 'Greek Yogurt', 'Lemon', 'Tandoori Masala', 'Cucumber'],
    macros: { protein: 38, carbs: 8, fat: 12, calories: 290 },
    isVeg: false,
    instructions: ['Marinate chicken in spiced yogurt.', 'Roast until charred.', 'Serve with cucumber salad.', 'Drizzle with mint yogurt.'],
    proteinSource: 'Chicken (200g)',
    icon: '🍗'
  },
  {
    id: '13',
    name: 'Rajma Chawal (High Protein Portion)',
    ingredients: ['Kidney Beans', 'Rice', 'Tomato', 'Onion', 'Spices'],
    macros: { protein: 16, carbs: 45, fat: 5, calories: 320 },
    isVeg: true,
    instructions: ['Boil soaked kidney beans.', 'Make thick onion-tomato gravy.', 'Simmer beans in gravy.', 'Serve over a small portion of rice.'],
    proteinSource: 'Kidney Beans',
    icon: '🍛'
  }
];

export default function SmartRecipeGenerator({ dietaryPreference }: Props) {
  const [pantry, setPantry] = useState<string[]>(['Chicken', 'Spinach', 'Paneer']);
  const [inputValue, setInputValue] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const isVegMode = dietaryPreference === 'veg' || dietaryPreference === 'vegan';

  const addIngredient = () => {
    if (inputValue.trim() && !pantry.includes(inputValue.trim())) {
      setPantry([...pantry, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeIngredient = (ing: string) => {
    setPantry(pantry.filter(i => i !== ing));
  };

  const suggestedRecipes = useMemo(() => {
    return ALL_RECIPES.filter(recipe => {
      // Filter by diet
      if (isVegMode && !recipe.isVeg) return false;
      if (!isVegMode && recipe.isVeg) return false; // In this app, we show non-veg for non-veg users, but sometimes they want veg too. 
      // But requirement says "Strictly follow global toggle".
      
      // Match at least one ingredient or show all relevant if pantry is empty
      if (pantry.length === 0) return true;
      return recipe.ingredients.some(ri => 
        pantry.some(pi => ri.toLowerCase().includes(pi.toLowerCase()) || pi.toLowerCase().includes(ri.toLowerCase()))
      );
    }).slice(0, 5);
  }, [pantry, isVegMode]);

  return (
    <div className="space-y-8">
      {/* Virtual Pantry Section */}
      <section className="bg-panel border border-border rounded-3xl p-6 overflow-hidden relative shadow-sm">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <ChefHat className="text-primary w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-main">Virtual Pantry</h2>
              <p className="text-text-muted text-sm">Add ingredients you have on hand</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search ingredients (e.g. Chicken, Tofu, Spinach...)"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addIngredient()}
                className="w-full bg-surface border border-border rounded-2xl py-3 pl-12 pr-4 text-text-main placeholder-text-muted focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
            <button 
              onClick={addIngredient}
              className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {pantry.map(ing => (
                <motion.div
                  key={ing}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 bg-surface hover:bg-border border border-border rounded-full px-4 py-2 text-sm text-text-main group cursor-default transition-colors"
                >
                  {ing}
                  <button 
                    onClick={() => removeIngredient(ing)}
                    className="text-text-muted hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Suggested Recipes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-text-main font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Suggested High-Protein Meals
            </h3>
            <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/10 px-2 py-1 rounded">
              {suggestedRecipes.length} Found
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {suggestedRecipes.map((recipe, idx) => (
                <motion.div
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedRecipe?.id === recipe.id 
                      ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(71,85,105,0.08)]' 
                      : 'bg-panel border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center group-hover:scale-110 transition-transform">
                      {recipe.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-text-main font-bold text-sm group-hover:text-primary transition-colors">{recipe.name}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center gap-1">
                          <Zap size={10} className="text-primary" />
                          <span className="text-[10px] font-bold text-text-muted">{recipe.macros.protein}g P</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame size={10} className="text-orange-500" />
                          <span className="text-[10px] font-bold text-text-muted">{recipe.macros.calories} kcal</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplets size={10} className="text-blue-500" />
                          <span className="text-[10px] font-bold text-text-muted">{recipe.macros.carbs}g C</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Info size={10} className="text-yellow-500" />
                          <span className="text-[10px] font-bold text-text-muted">{recipe.macros.fat}g F</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden xl:flex gap-1">
                      {recipe.ingredients.slice(0, 2).map(i => (
                        <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-surface text-text-muted border border-border whitespace-nowrap">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* 3D Visualizer & Details */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {selectedRecipe ? (
              <motion.div
                key={selectedRecipe.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-panel border border-border rounded-3xl overflow-hidden h-full flex flex-col shadow-sm"
              >
                <div className="h-[300px] bg-surface border-b border-border relative">
                  <FoodPlate3D 
                    key={selectedRecipe.id}
                    proteinSource={selectedRecipe.proteinSource} 
                    isVeg={selectedRecipe.isVeg} 
                  />
                </div>
                
                <div className="p-6 flex-1 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-text-main">{selectedRecipe.name}</h3>
                      <p className="text-primary text-xs font-black uppercase tracking-[0.2em] mt-1">
                        High Protein Optimization
                      </p>
                    </div>
                    <div className="bg-primary/20 p-2 rounded-lg text-primary">
                      <Utensils size={20} />
                    </div>
                  </div>

                  {/* Nutrition Label Style Macros */}
                  <div className="bg-white text-black p-4 rounded-lg font-mono shadow-2xl border border-border">
                    <div className="border-b-8 border-black pb-1 mb-1">
                      <h4 className="text-2xl font-black leading-none">Nutrition Facts</h4>
                    </div>
                    <div className="border-b border-black text-sm mb-1">
                      <p>Serving Size: 1 Meal</p>
                    </div>
                    <div className="border-b-4 border-black flex justify-between items-end pb-1 mb-1">
                      <div className="font-black text-sm">Amount Per Serving</div>
                    </div>
                    <div className="border-b border-black flex justify-between items-baseline mb-1">
                      <div className="font-black text-xl">Calories</div>
                      <div className="font-black text-2xl">{selectedRecipe.macros.calories}</div>
                    </div>
                    <div className="text-right text-xs font-black border-b border-black mb-1">% Daily Value*</div>
                    <div className="border-b border-black flex justify-between py-0.5">
                      <div><span className="font-black">Total Fat</span> {selectedRecipe.macros.fat}g</div>
                      <div className="font-black">{Math.round(selectedRecipe.macros.fat/65*100)}%</div>
                    </div>
                    <div className="border-b border-black flex justify-between py-0.5">
                      <div><span className="font-black">Total Carbohydrate</span> {selectedRecipe.macros.carbs}g</div>
                      <div className="font-black">{Math.round(selectedRecipe.macros.carbs/300*100)}%</div>
                    </div>
                    <div className="border-b-4 border-black flex justify-between py-0.5">
                      <div><span className="font-black">Protein</span> {selectedRecipe.macros.protein}g</div>
                      <div className="font-black text-primary">{Math.round(selectedRecipe.macros.protein/50*100)}%</div>
                    </div>
                    <p className="text-[8px] mt-1 italic">* Percent Daily Values are based on a 2,000 calorie diet.</p>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-text-muted text-[10px] font-black uppercase tracking-widest opacity-50">Ingredients Used</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecipe.ingredients.map(i => (
                        <span key={i} className="px-3 py-1 bg-surface rounded-lg border border-border text-xs text-text-muted">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Add to Log
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-panel border border-dashed border-border rounded-3xl h-[600px] flex flex-col items-center justify-center text-center p-8 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 border border-border">
                  <ChefHat size={32} className="text-text-muted" />
                </div>
                <h4 className="text-text-main font-bold mb-2">Select a recipe to visualize</h4>
                <p className="text-text-muted text-sm max-w-[250px]">
                  Pick one of the high-protein suggestions to see its macro breakdown and 3D plate.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
