import { useEffect, useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Star, Flame, Trophy, Leaf, UtensilsCrossed, Camera, Sparkles, Target, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { FoodItem, DietaryPreference, MealType, UserProfile } from '../../types';
import { calculateNutrition } from '../../lib/calculations';
import FoodCard from './FoodCard';
import VisionScanModal from './VisionScanModal';

interface Props {
  profile: UserProfile;
}

const mealTabs: { value: MealType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
];

const dietLabels: Record<DietaryPreference, string> = {
  non_veg: 'Non-Veg',
  veg: 'Vegetarian',
  vegan: 'Vegan',
  keto: 'Keto',
};

export default function NutritionView({ profile }: Props) {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDiet, setActiveDiet] = useState<DietaryPreference>(profile.dietary_preference);
  const [activeMeal, setActiveMeal] = useState<MealType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const [loggedFoods, setLoggedFoods] = useState<FoodItem[]>(() => {
    try {
      const raw = localStorage.getItem('aura_food_log');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('aura_food_log', JSON.stringify(loggedFoods));
  }, [loggedFoods]);

  const targets = useMemo(() => calculateNutrition(profile), [profile]);
  
  const consumed = useMemo(() => {
    return loggedFoods.reduce((acc, curr) => ({
      calories: acc.calories + curr.calories,
      protein: acc.protein + curr.protein_g,
      carbs: acc.carbs + curr.carbs_g,
      fat: acc.fat + curr.fat_g,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [loggedFoods]);

  const handleLogFood = (item: FoodItem) => {
    setLoggedFoods(prev => [item, ...prev]);
  };

  const removeLoggedFood = (index: number) => {
    setLoggedFoods(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    setActiveDiet(profile.dietary_preference);
  }, [profile.dietary_preference]);

  useEffect(() => {
    fetchFoods();
  }, []);

  const indianFoods: FoodItem[] = [
    { id: 'ind-1', name: 'Paneer Butter Masala', category: 'protein', serving_g: 150, calories: 350, protein_g: 14, carbs_g: 12, fat_g: 28, is_veg: true, is_vegan: false, is_non_veg: false, is_keto: true, meal_type: 'lunch' },
    { id: 'ind-2', name: 'Chana Masala', category: 'carbs', serving_g: 200, calories: 280, protein_g: 12, carbs_g: 45, fat_g: 6, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'lunch' },
    { id: 'ind-3', name: 'Palak Paneer', category: 'vegetables', serving_g: 200, calories: 240, protein_g: 16, carbs_g: 10, fat_g: 18, is_veg: true, is_vegan: false, is_non_veg: false, is_keto: true, meal_type: 'dinner' },
    { id: 'ind-4', name: 'Chicken Biryani', category: 'protein', serving_g: 300, calories: 450, protein_g: 28, carbs_g: 55, fat_g: 14, is_veg: false, is_vegan: false, is_non_veg: true, is_keto: false, meal_type: 'dinner' },
    { id: 'ind-5', name: 'Dal Makhani', category: 'protein', serving_g: 200, calories: 290, protein_g: 14, carbs_g: 32, fat_g: 12, is_veg: true, is_vegan: false, is_non_veg: false, is_keto: false, meal_type: 'dinner' },
    { id: 'ind-6', name: 'Masala Dosa', category: 'carbs', serving_g: 150, calories: 240, protein_g: 5, carbs_g: 42, fat_g: 6, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'breakfast' },
    { id: 'ind-7', name: 'Soya Chunk Curry', category: 'protein', serving_g: 150, calories: 180, protein_g: 25, carbs_g: 12, fat_g: 4, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'lunch' },
    { id: 'ind-8', name: 'Chicken Tikka Masala', category: 'protein', serving_g: 200, calories: 320, protein_g: 30, carbs_g: 10, fat_g: 18, is_veg: false, is_vegan: false, is_non_veg: true, is_keto: true, meal_type: 'dinner' },
    { id: 'ind-9', name: 'Aloo Gobi', category: 'vegetables', serving_g: 200, calories: 150, protein_g: 4, carbs_g: 28, fat_g: 5, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'lunch' },
    { id: 'ind-10', name: 'Egg Bhurji', category: 'protein', serving_g: 100, calories: 190, protein_g: 14, carbs_g: 5, fat_g: 13, is_veg: false, is_vegan: false, is_non_veg: true, is_keto: true, meal_type: 'breakfast' },
    { id: 'ind-11', name: 'Rajma Chawal', category: 'carbs', serving_g: 300, calories: 420, protein_g: 18, carbs_g: 72, fat_g: 6, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'lunch' },
    { id: 'ind-12', name: 'Mutton Rogan Josh', category: 'protein', serving_g: 200, calories: 380, protein_g: 32, carbs_g: 6, fat_g: 26, is_veg: false, is_vegan: false, is_non_veg: true, is_keto: true, meal_type: 'dinner' },
    { id: 'ind-13', name: 'Idli Sambar', category: 'carbs', serving_g: 200, calories: 160, protein_g: 6, carbs_g: 30, fat_g: 2, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'breakfast' },
    { id: 'ind-14', name: 'Moong Dal Cheela', category: 'protein', serving_g: 100, calories: 140, protein_g: 10, carbs_g: 18, fat_g: 3, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'breakfast' },
    // Additional everyday Indian household dishes
    { id: 'ind-15', name: 'Roti (Wheat Chapati)', category: 'carbs', serving_g: 35, calories: 100, protein_g: 3, carbs_g: 20, fat_g: 1, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'lunch' },
    { id: 'ind-16', name: 'Paratha (Whole Wheat)', category: 'carbs', serving_g: 80, calories: 220, protein_g: 5, carbs_g: 32, fat_g: 9, is_veg: true, is_vegan: false, is_non_veg: false, is_keto: false, meal_type: 'breakfast' },
    { id: 'ind-17', name: 'Aloo Paratha', category: 'carbs', serving_g: 100, calories: 260, protein_g: 5, carbs_g: 38, fat_g: 11, is_veg: true, is_vegan: false, is_non_veg: false, is_keto: false, meal_type: 'breakfast' },
    { id: 'ind-18', name: 'Upma', category: 'carbs', serving_g: 200, calories: 200, protein_g: 5, carbs_g: 35, fat_g: 5, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'breakfast' },
    { id: 'ind-19', name: 'Poha (Flattened Rice)', category: 'carbs', serving_g: 150, calories: 180, protein_g: 4, carbs_g: 35, fat_g: 4, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'breakfast' },
    { id: 'ind-20', name: 'Sabudana Khichdi', category: 'carbs', serving_g: 150, calories: 250, protein_g: 3, carbs_g: 48, fat_g: 6, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'breakfast' },
    { id: 'ind-21', name: 'Kadhi Pakora', category: 'vegetables', serving_g: 200, calories: 220, protein_g: 6, carbs_g: 22, fat_g: 13, is_veg: true, is_vegan: false, is_non_veg: false, is_keto: false, meal_type: 'lunch' },
    { id: 'ind-22', name: 'Baingan Bharta', category: 'vegetables', serving_g: 150, calories: 100, protein_g: 3, carbs_g: 12, fat_g: 5, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'dinner' },
    { id: 'ind-23', name: 'Matar Paneer', category: 'protein', serving_g: 200, calories: 300, protein_g: 14, carbs_g: 20, fat_g: 20, is_veg: true, is_vegan: false, is_non_veg: false, is_keto: false, meal_type: 'dinner' },
    { id: 'ind-24', name: 'Chicken Curry (Homestyle)', category: 'protein', serving_g: 200, calories: 280, protein_g: 28, carbs_g: 8, fat_g: 16, is_veg: false, is_vegan: false, is_non_veg: true, is_keto: true, meal_type: 'dinner' },
    { id: 'ind-25', name: 'Anda Curry (Egg Curry)', category: 'protein', serving_g: 200, calories: 240, protein_g: 16, carbs_g: 8, fat_g: 17, is_veg: false, is_vegan: false, is_non_veg: true, is_keto: true, meal_type: 'dinner' },
    { id: 'ind-26', name: 'Jeera Rice', category: 'carbs', serving_g: 200, calories: 280, protein_g: 5, carbs_g: 56, fat_g: 5, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'lunch' },
    { id: 'ind-27', name: 'Khichdi', category: 'carbs', serving_g: 250, calories: 260, protein_g: 10, carbs_g: 46, fat_g: 5, is_veg: true, is_vegan: true, is_non_veg: false, is_keto: false, meal_type: 'dinner' },
    { id: 'ind-28', name: 'Dahi (Curd/Yogurt)', category: 'protein', serving_g: 150, calories: 90, protein_g: 5, carbs_g: 8, fat_g: 4, is_veg: true, is_vegan: false, is_non_veg: false, is_keto: true, meal_type: 'snack' },
    { id: 'ind-29', name: 'Paneer (Raw / Cubed)', category: 'protein', serving_g: 100, calories: 260, protein_g: 18, carbs_g: 2, fat_g: 20, is_veg: true, is_vegan: false, is_non_veg: false, is_keto: true, meal_type: 'snack' },
    { id: 'ind-30', name: 'Lassi (Sweet, Full Fat)', category: 'fat', serving_g: 250, calories: 180, protein_g: 7, carbs_g: 25, fat_g: 6, is_veg: true, is_vegan: false, is_non_veg: false, is_keto: false, meal_type: 'snack' },
  ];

  const fetchFoods = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('food_items').select('*').order('category');
    
    // Merge DB foods with static Indian foods to ensure they are always available
    const dbFoods = (!error && data) ? data : [];
    setFoods([...dbFoods, ...indianFoods]);
    
    setLoading(false);
  };

  const filtered = foods.filter(f => {
    const dietMatch =
      activeDiet === 'non_veg' ? f.is_non_veg || f.is_veg :
      activeDiet === 'veg' ? f.is_veg :
      activeDiet === 'vegan' ? f.is_vegan :
      activeDiet === 'keto' ? f.is_keto : true;

    const mealMatch = activeMeal === 'all' || f.meal_type === activeMeal;
    const catMatch = activeCategory === 'all' || f.category === activeCategory;
    const searchMatch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    return dietMatch && mealMatch && catMatch && searchMatch;
  });

  const recommendations = useMemo(() => {
    const isVeg = activeDiet === 'veg' || activeDiet === 'vegan';

    if (isVeg) {
      return [
        { name: 'Paneer Tikka (Grilled)', protein: '16g', cals: '220', icon: Flame, tag: 'High Protein' },
        { name: 'Dal Tadka (Lentils)', protein: '7g', cals: '120', icon: Leaf, tag: 'Essential' },
        { name: 'Soya Chaap (Roasted)', protein: '15g', cals: '180', icon: Trophy, tag: 'Mass Gainer' },
      ];
    }
    return [
      { name: 'Chicken Tikka (Tandoori)', protein: '26g', cals: '150', icon: Flame, tag: 'Lean Protein' },
      { name: 'Egg Bhurji (Scramble)', protein: '13g', cals: '160', icon: UtensilsCrossed, tag: 'Quick Breakfast' },
      { name: 'Fish Amritsari (Grilled)', protein: '24g', cals: '160', icon: Trophy, tag: 'Heart Healthy' },
    ];
  }, [activeDiet, profile.goal, profile.training_mode]);

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Nutrition Hub
            <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-1 rounded-full tracking-widest border border-primary/20">
              AI Powered
            </span>
          </h1>
          <p className="text-[#6b7280] text-sm mt-1">Smart tracking for your goals</p>
        </div>
      </div>

      {/* Daily Macro Progress Section */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Daily Targets</h2>
            <p className="text-[#6b7280] text-xs uppercase tracking-widest font-semibold">Goal: {profile.goal}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Calories */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#6b7280] font-bold">Calories</span>
              <span className="text-white font-bold">{consumed.calories} <span className="text-[#6b7280]">/ {targets.targetCalories}</span></span>
            </div>
            <div className="h-2 w-full bg-[#1f1f1f] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (consumed.calories / targets.targetCalories) * 100)}%` }}
                className={`h-full ${consumed.calories > targets.targetCalories ? 'bg-red-500' : 'bg-primary'}`}
              />
            </div>
          </div>
          {/* Protein */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#3b82f6] font-bold">Protein</span>
              <span className="text-white font-bold">{consumed.protein}g <span className="text-[#6b7280]">/ {targets.targetProtein}g</span></span>
            </div>
            <div className="h-2 w-full bg-[#1f1f1f] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (consumed.protein / targets.targetProtein) * 100)}%` }}
                className="h-full bg-[#3b82f6]"
              />
            </div>
          </div>
          {/* Carbs */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#f59e0b] font-bold">Carbs</span>
              <span className="text-white font-bold">{consumed.carbs}g <span className="text-[#6b7280]">/ {targets.targetCarbs}g</span></span>
            </div>
            <div className="h-2 w-full bg-[#1f1f1f] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (consumed.carbs / targets.targetCarbs) * 100)}%` }}
                className="h-full bg-[#f59e0b]"
              />
            </div>
          </div>
          {/* Fat */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#ef4444] font-bold">Fats</span>
              <span className="text-white font-bold">{consumed.fat}g <span className="text-[#6b7280]">/ {targets.targetFat}g</span></span>
            </div>
            <div className="h-2 w-full bg-[#1f1f1f] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (consumed.fat / targets.targetFat) * 100)}%` }}
                className="h-full bg-[#ef4444]"
              />
            </div>
          </div>
        </div>

        {/* Logged Foods List */}
        {loggedFoods.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#1f1f1f]">
            <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-widest text-[#6b7280]">Logged Today ({loggedFoods.length})</h3>
            <div className="space-y-3">
              <AnimatePresence>
                {loggedFoods.map((food, index) => (
                  <motion.div 
                    key={`${food.id}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {food.meal_type === 'breakfast' ? '🌅' : food.meal_type === 'lunch' ? '☀️' : food.meal_type === 'dinner' ? '🌙' : '🥜'}
                      </span>
                      <div>
                        <p className="text-white text-sm font-bold">{food.name}</p>
                        <p className="text-[#6b7280] text-xs">{food.calories} kcal • {food.protein_g}g P • {food.carbs_g}g C • {food.fat_g}g F</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeLoggedFood(index)}
                      className="text-[#4b5563] hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-white">Food Explorer</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 w-full sm:w-auto flex-1">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b5563]" />
              <input
                type="text"
                placeholder="Search database..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#111111] border border-[#1f1f1f] rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            
            <button 
              onClick={() => setIsScanModalOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap"
            >
              <Camera size={16} />
              <span className="hidden sm:inline">Vision Scan</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <SlidersHorizontal size={15} className="text-[#6b7280] flex-shrink-0" />
            <div className="flex gap-1">
              {(['all', 'protein', 'carbs', 'fat', 'vegetables'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-[#1f1f1f] text-white'
                      : 'text-[#6b7280] hover:text-[#9ca3af]'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#111111] to-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Star size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Star size={16} className="text-primary" />
              </div>
              <h2 className="text-white font-bold uppercase tracking-widest text-xs">Curated Indian Picks</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec, i) => (
                <div key={i} className="bg-[#0a0a0a]/50 border border-white/5 rounded-xl p-4 hover:border-primary/30 transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <rec.icon size={20} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded">
                      {rec.tag}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">{rec.name}</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[#6b7280] text-[10px] uppercase font-bold">Protein: <span className="text-white">{rec.protein}</span></p>
                    <p className="text-[#6b7280] text-[10px] uppercase font-bold">Cals: <span className="text-white">{rec.cals}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-1 flex gap-1">
            {(Object.keys(dietLabels) as DietaryPreference[]).map(diet => (
              <button
                key={diet}
                onClick={() => setActiveDiet(diet)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeDiet === diet
                    ? 'bg-primary text-white'
                    : 'text-[#6b7280] hover:text-[#9ca3af]'
                }`}
              >
                {dietLabels[diet]}
              </button>
            ))}
          </div>

          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-1 flex gap-1 overflow-x-auto scrollbar-hide">
            {mealTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveMeal(tab.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  activeMeal === tab.value
                    ? 'bg-[#1f1f1f] text-white'
                    : 'text-[#6b7280] hover:text-[#9ca3af]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#6b7280]">No foods found for this filter combination.</p>
          </div>
        ) : (
          <div>
            <p className="text-[#4b5563] text-xs mb-4">{filtered.length} foods found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(food => (
                <FoodCard key={food.id} item={food} onLog={handleLogFood} />
              ))}
            </div>
          </div>
        )}
      </div>

      <VisionScanModal 
        isOpen={isScanModalOpen} 
        onClose={() => setIsScanModalOpen(false)} 
        profile={profile} 
      />
    </div>
  );
}

