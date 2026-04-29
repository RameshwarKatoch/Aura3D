import { X, Play, Utensils, Zap, Timer, Bed } from 'lucide-react';
import type { MuscleGroup } from './Anatomy3D';
import type { TrainingMode } from '../../types';

interface Props {
  muscle: MuscleGroup;
  onClose: () => void;
  isVeg: boolean;
  trainingMode: TrainingMode;
}

export default function MuscleSidePanel({ muscle, onClose, isVeg, trainingMode }: Props) {
  if (!muscle) return null;

  const exerciseMap: Record<string, Record<TrainingMode, string[]>> = {
    Chest: {
      power: ['Barbell Bench Press (Heavy)', 'Incline DB Press', 'Weighted Dips'],
      endurance: ['Push-ups (Max Reps)', 'Cable Flyes', 'Chest Press Machine'],
      recovery: ['Doorway Chest Stretch', 'Foam Rolling Pecs', 'Light Push-ups'],
    },
    Quads: {
      power: ['Barbell Squats', 'Hack Squats', 'Leg Press (Heavy)'],
      endurance: ['Goblet Squats', 'Walking Lunges', 'Cycling (High Cadence)'],
      recovery: ['Quad Stretch', 'Foam Rolling Quads', 'Bodyweight Squats'],
    },
    Biceps: {
      power: ['Heavy Barbell Curls', 'Weighted Chin-ups', 'Hammer Curls'],
      endurance: ['Concentration Curls', 'Resistance Band Curls', 'Zottman Curls'],
      recovery: ['Bicep Wall Stretch', 'Arm Swings', 'Light Curls'],
    },
    Abs: {
      power: ['Weighted Planks', 'Hanging Leg Raises', 'Ab Wheel'],
      endurance: ['Bicycle Crunches', 'Mountain Climbers', 'Flutter Kicks'],
      recovery: ['Cobra Stretch', 'Childs Pose', 'Cat-Cow'],
    },
    Shoulders: {
      power: ['Overhead Press', 'Push Press', 'Heavy Lateral Raises'],
      endurance: ['Face Pulls', 'Front Raises', 'Shadow Boxing'],
      recovery: ['Cross-body Stretch', 'Shoulder Rolls', 'Wall Slides'],
    },
    Forearms: {
      power: ['Dead Hangs', 'Farmer Walks', 'Wrist Roller'],
      endurance: ['Wrist Curls (High Reps)', 'Tennis Ball Squeezes', 'Towel Hangs'],
      recovery: ['Wrist Extensor Stretch', 'Wrist Circles', 'Massage'],
    },
    Calves: {
      power: ['Donkey Calf Raises', 'Sled Calf Press', 'Explosive Box Jumps'],
      endurance: ['Seated Calf Raises', 'Jump Rope', 'Stair Climbing'],
      recovery: ['Calf Stretch (Wall)', 'Ankle Circles', 'Foam Rolling Calves'],
    },
    Glutes: {
      power: ['Hip Thrusts (Heavy)', 'Deadlifts', 'Sumo Squats'],
      endurance: ['Glute Bridges', 'Clamshells', 'Step-ups'],
      recovery: ['Pigeon Pose', 'Glute Self-Massage', 'Knee to Chest'],
    },
    Hamstrings: {
      power: ['Romanian Deadlifts', 'Glute-Ham Raises', 'Heavy Leg Curls'],
      endurance: ['Good Mornings', 'Kettlebell Swings', 'Swiss Ball Curls'],
      recovery: ['Hamstring Stretch', 'Leg Swings', 'Foam Rolling Hams'],
    },
    Triceps: {
      power: ['Close Grip Bench', 'Weighted Dips', 'Skull Crushers'],
      endurance: ['Tricep Extensions', 'Kickbacks', 'Diamond Push-ups'],
      recovery: ['Overhead Tricep Stretch', 'Arm Rotations', 'Light Pushdowns'],
    },
    Lats: {
      power: ['Weighted Pull-ups', 'Barbell Rows', 'T-Bar Rows'],
      endurance: ['Lat Pulldowns', 'Straight Arm Pulldowns', 'Seated Rows'],
      recovery: ['Lat Stretch (Bar Hang)', 'Thoracic Extension', 'Light Rows'],
    },
    Traps: {
      power: ['Heavy Shrugs', 'Rack Pulls', 'Power Cleans'],
      endurance: ['Face Pulls', 'Upright Rows', 'Farmer Walks'],
      recovery: ['Upper Trap Stretch', 'Neck Tilts', 'Shoulder Depressions'],
    }
  };

  const snackContent: Record<string, { veg: string; nonVeg: string }> = {
    Chest: { veg: 'Paneer Tikka (Grilled)', nonVeg: 'Chicken Tikka (Tandoori)' },
    Quads: { veg: 'Sattu Protein Shake', nonVeg: 'Egg Bhurji (3 Eggs)' },
    Biceps: { veg: 'Roasted Soya Chunks', nonVeg: 'Tuna Masala' },
    Abs: { veg: 'Sprouted Moong Salad', nonVeg: 'Boiled Egg Whites' },
    Shoulders: { veg: 'Roasted Makhana (Fox Nuts)', nonVeg: 'Chicken Seekh Kebab' },
    Forearms: { veg: 'Peanut Chaat', nonVeg: 'Dried Fish (Masala)' },
    Calves: { veg: 'Mishti Doi (Protein)', nonVeg: 'Shrimp Pepper Fry' },
    Glutes: { veg: 'Rajma Salad', nonVeg: 'Mutton Shami Kebab' },
    Hamstrings: { veg: 'Tofu Bhurji', nonVeg: 'Grilled Fish Fillet' },
    Triceps: { veg: 'Greek Yogurt (Indian Spiced)', nonVeg: 'Chicken Salad' },
    Lats: { veg: 'Tempeh Masala', nonVeg: 'Cod Fish (Steamed)' },
    Traps: { veg: 'Chickpea (Chana) Sundal', nonVeg: 'Chicken Breast Curry' }
  };

  const exercises = exerciseMap[muscle]?.[trainingMode] || ['Compound Movement', 'Isolation Move'];
  const snacks = snackContent[muscle] || { veg: 'Plant Protein', nonVeg: 'Animal Protein' };

  const modeInfo = {
    power: { label: 'Power Mode', icon: Zap, color: 'text-primary' },
    endurance: { label: 'Endurance Mode', icon: Timer, color: 'text-emerald-500' },
    recovery: { label: 'Recovery Mode', icon: Bed, color: 'text-purple-500' },
  }[trainingMode];

  const ModeIcon = modeInfo.icon;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-[#111111]/95 backdrop-blur-md border-l border-[#1f1f1f] shadow-2xl z-20 flex flex-col transform transition-transform duration-300">
      <div className="p-4 border-b border-[#1f1f1f] flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">{muscle} Focus</h3>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-[#2a2a2a] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]`}>
          <ModeIcon size={14} className={modeInfo.color} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${modeInfo.color}`}>
            {modeInfo.label} Focus
          </span>
        </div>

        <div>
          <h4 className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider mb-3">Recommended Exercises</h4>
          <div className="space-y-3">
            {exercises.map((exercise, idx) => (
              <div key={idx} className="bg-[#1a1a1a] p-3 rounded-xl border border-[#2a2a2a] flex items-center gap-3 group hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                  <Play size={16} className="text-primary ml-0.5" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{exercise}</p>
                  <p className="text-[#6b7280] text-xs">{trainingMode === 'recovery' ? 'View Tutorial' : 'Log Set'}</p>
                </div>
              </div>
            ))}
          </div>
          {trainingMode === 'recovery' && (
            <p className="mt-3 text-[#6b7280] text-[10px] italic leading-tight bg-[#1a1a1a] p-2 rounded-lg border border-dashed border-[#2a2a2a]">
              Tip: Recovery mode focuses on low-intensity mobility and blood flow. Avoid heavy loads to allow tissue repair.
            </p>
          )}
        </div>

        <div>
          <h4 className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider mb-3">High-Protein Snack</h4>
          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#2a2a2a] flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Utensils size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-primary text-xs font-medium mb-1">{isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</p>
              <p className="text-white text-sm leading-snug">{isVeg ? snacks.veg : snacks.nonVeg}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
