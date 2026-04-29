import type { UserProfile, WorkoutSet, SleepEntry } from '../types';

interface CoachContext {
  profile: UserProfile;
  workoutSets: WorkoutSet[];
  sleepData: SleepEntry[];
  message: string;
}

interface CoachResponse {
  text: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avgSleep(sleepData: SleepEntry[]): number {
  if (!sleepData.length) return 7;
  const recent = sleepData.slice(-3);
  return recent.reduce((s, e) => s + e.hours, 0) / recent.length;
}

function recentSets(sets: WorkoutSet[], hours = 48): WorkoutSet[] {
  const cutoff = Date.now() - hours * 3600_000;
  return sets.filter(s => s.timestamp > cutoff);
}

function volumeByMuscle(sets: WorkoutSet[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sets) {
    map[s.muscleGroup] = (map[s.muscleGroup] ?? 0) + s.weight * s.reps;
  }
  return map;
}

function isVeg(profile: UserProfile): boolean {
  return profile.dietary_preference === 'veg' || profile.dietary_preference === 'vegan';
}

function estProteinIntake(sets: WorkoutSet[], profile: UserProfile): number {
  // Rough estimate: 1g per kg baseline + 5g per set logged today
  const todaySets = sets.filter(s => {
    const d = new Date(s.timestamp);
    return d.toDateString() === new Date().toDateString();
  });
  return Math.round(profile.weight_kg * 0.8 + todaySets.length * 5);
}

function hoursAgo(ts: number): number {
  return (Date.now() - ts) / 3600_000;
}

function mostRecentPerMuscle(sets: WorkoutSet[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sets) {
    if (!map[s.muscleGroup] || s.timestamp > map[s.muscleGroup]) {
      map[s.muscleGroup] = s.timestamp;
    }
  }
  return map;
}

// ─── Intent Detection ────────────────────────────────────────────────────────

function detectIntent(msg: string): string {
  const m = msg.toLowerCase();
  if (/tired|exhausted|fatigue|sleepy|no energy|drained|lethargy/.test(m)) return 'tired';
  if (/protein|not eating enough|macro|amino|whey|casein/.test(m)) return 'protein';
  if (/sleep|rest|insomnia|can't sleep|poor sleep|bedtime/.test(m)) return 'sleep';
  if (/motivat|unmotivated|lazy|don't want to|skip|procrastinat/.test(m)) return 'motivation';
  if (/what should i eat|meal|food|snack|diet|nutrition|eat today/.test(m)) return 'meal';
  if (/workout|exercise|train|gym|lift|session|sets|reps/.test(m)) return 'workout';
  if (/weight|lose|gain|bulk|cut|fat loss|cutting|bulking/.test(m)) return 'weight';
  if (/recov|sore|ache|pain|hurt|dom|stiff/.test(m)) return 'recovery';
  if (/water|hydrat|drink|thirst/.test(m)) return 'hydration';
  if (/progress|improve|better|stronger|faster|result/.test(m)) return 'progress';
  if (/hello|hi|hey|sup|start|begin|help/.test(m)) return 'greet';
  if (/stress|anxiety|mental|burnout|overwhelm|depress/.test(m)) return 'mental';
  if (/creatine|supplement|pre.?workout|bcaa|protein powder|whey|mass gainer/.test(m)) return 'supplements';
  if (/cardio|run|jog|cycle|swim|treadmill|hiit|aerobic/.test(m)) return 'cardio';
  if (/indian|desi|roti|dal|paneer|biryani|sabzi|chapati|ghee/.test(m)) return 'indian';
  if (/bmi|body fat|overweight|obese|underweight/.test(m)) return 'bmi';
  if (/beginner|start|first time|new to gym|never worked|just started/.test(m)) return 'beginner';
  if (/how many|how much|how long|when should|what time|best time/.test(m)) return 'howto';
  return 'general';
}

// ─── Response Generators ─────────────────────────────────────────────────────

function respondTired(ctx: CoachContext): string {
  const avg = avgSleep(ctx.sleepData);
  const recent = recentSets(ctx.workoutSets, 24);
  const muscles = [...new Set(recent.map(s => s.muscleGroup))];
  const sleepNote =
    avg < 6
      ? `Your average sleep is only **${avg.toFixed(1)} hours** — that's significantly below the 7–9h needed for recovery.`
      : avg < 7
      ? `You're averaging **${avg.toFixed(1)} hours** of sleep, which is slightly low. Even a 30-minute improvement makes a big difference.`
      : `Your sleep looks decent at **${avg.toFixed(1)} hours**, but energy dips can still happen from training load.`;

  const muscleNote =
    muscles.length > 0
      ? `I can see you trained **${muscles.join(', ')}** in the last 24 hours. These muscles need time to repair.`
      : 'Your recent training volume looks manageable.';

  return `I hear you — let's dial it back today. 🌙

${sleepNote}

${muscleNote}

**My recommendation: Switch to Recovery Mode today.**
- 🧘 Light yoga or a 20-min walk
- 🚫 No heavy compound lifts
- 💧 Increase water intake by at least 500ml
- 🥣 Focus on anti-inflammatory foods (berries, leafy greens, oily fish or tofu)

Your body builds muscle *during* rest, not during the workout itself. A smart recovery day is a power move. 💪`;
}

function respondProtein(ctx: CoachContext): string {
  const { profile } = ctx;
  const target = Math.round(profile.weight_kg * 1.6);
  const estimated = estProteinIntake(ctx.workoutSets, profile);
  const gap = Math.max(0, target - estimated);

  if (isVeg(profile)) {
    return `Great question! Let's close that protein gap. 🌱

**Your target:** ~${target}g/day | **Estimated today:** ~${estimated}g | **Gap:** ${gap}g

Here are my top **vegetarian protein boosters** to hit that gap:

| Food | Protein | Notes |
|------|---------|-------|
| Greek Yogurt (200g) | **20g** | High in casein, great before bed |
| Cottage Cheese (200g) | **22g** | Slow-digesting, perfect snack |
| Lentil Dal (1 cup cooked) | **18g** | Also high in iron |
| Tofu Scramble (200g) | **16g** | Use firm tofu, add nutritional yeast |
| Edamame (1 cup) | **17g** | Great as a snack or salad topper |
| Chickpea Salad (200g) | **15g** | Filling + fiber-rich |
| Protein Shake + Almond Butter | **30g** | Quick fix if you're short |

💡 **Pro tip:** Combine rice + lentils for a complete amino acid profile — no supplements needed!`;
  } else {
    return `Let's bridge that protein gap! 🍗

**Your target:** ~${target}g/day | **Estimated today:** ~${estimated}g | **Gap:** ${gap}g

**Top protein sources to add right now:**

| Food | Protein | Notes |
|------|---------|-------|
| Grilled Chicken Breast (150g) | **45g** | Highest protein density |
| Canned Tuna (1 can) | **30g** | Quick, zero prep |
| Eggs × 3 whole | **18g** | Complete amino acid profile |
| Greek Yogurt (200g) | **20g** | Great pre-bed option |
| Cottage Cheese (200g) | **22g** | Slow-digesting casein |
| Salmon (150g) | **34g** | Also provides omega-3s |

💡 **Quick fix:** A chicken breast + Greek yogurt snack closes ~65g of protein gap in one go.`;
  }
}

function respondMeal(ctx: CoachContext): string {
  const { profile } = ctx;
  const mode = profile.training_mode ?? 'power';
  const modeLabel = { power: 'strength training', endurance: 'cardio', recovery: 'a rest day' }[mode];

  if (isVeg(profile)) {
    return `Here's a meal plan tuned for ${modeLabel} 🌱

**Breakfast:** Overnight oats with chia seeds, berries & almond butter (500 kcal, 22g protein)
**Lunch:** Lentil & spinach dal with brown rice + raita (650 kcal, 28g protein)
**Snack:** Greek yogurt + walnuts + a banana (300 kcal, 18g protein)
**Dinner:** Tofu stir-fry with broccoli, bell peppers & quinoa (600 kcal, 30g protein)

**Total:** ~2050 kcal | ~98g protein

💡 Add 1 scoop of plant protein if your target is higher than 120g.`;
  } else {
    return `Here's a meal plan tuned for ${modeLabel} 🍽️

**Breakfast:** 3 scrambled eggs + avocado toast + coffee (550 kcal, 28g protein)
**Lunch:** Grilled chicken breast + sweet potato + salad (650 kcal, 45g protein)
**Snack:** Cottage cheese + berries (250 kcal, 22g protein)
**Dinner:** Baked salmon + roasted vegetables + brown rice (700 kcal, 40g protein)

**Total:** ~2150 kcal | ~135g protein

💡 This plan keeps you in a slight ${profile.goal === 'lose' ? 'deficit' : profile.goal === 'gain' ? 'surplus' : 'maintenance'} based on your goal.`;
  }
}

function respondWorkout(ctx: CoachContext): string {
  const recent = recentSets(ctx.workoutSets, 168); // 7 days
  const byMuscle = volumeByMuscle(recent);
  const trained = Object.keys(byMuscle);
  const lastByMuscle = mostRecentPerMuscle(recent);
  const allMuscles = ['Chest', 'Quads', 'Biceps', 'Back', 'Shoulders', 'Hamstrings', 'Triceps', 'Core'];
  const untrained = allMuscles.filter(m => !trained.includes(m));
  const mode = ctx.profile.training_mode ?? 'power';

  if (trained.length === 0) {
    return `No workouts logged yet this week! Let's change that. 💪

For **${mode === 'power' ? 'Power' : mode === 'endurance' ? 'Endurance' : 'Recovery'} Mode**, I recommend starting with:
${mode === 'power'
  ? '- **Day 1:** Chest + Triceps (Bench Press, Incline DB, Tricep Pushdown)\n- **Day 2:** Back + Biceps (Deadlift, Pull-ups, Barbell Curl)\n- **Day 3:** Quads + Hamstrings (Squat, Romanian DL, Leg Press)'
  : mode === 'endurance'
  ? '- **Day 1:** Full-body circuit (3 rounds, 15 reps, minimal rest)\n- **Day 2:** Cardio (30-min steady state or HIIT)\n- **Day 3:** Core + Shoulders'
  : '- Focus on mobility, stretching, and light movement\n- No max-effort lifts this week\n- Prioritise sleep and nutrition'}

Log your first set using the **Overload Tracker** below! 👇`;
  }

  const sortedByVol = Object.entries(byMuscle).sort((a, b) => b[1] - a[1]);
  const top = sortedByVol[0];

  return `Here's your **7-day training summary:**

**Most trained:** ${top[0]} (${Math.round(top[1]).toLocaleString()} kg volume)
**Muscle groups hit:** ${trained.join(', ')}
${untrained.length > 0 ? `**⚠️ Neglected this week:** ${untrained.join(', ')}` : '**✅ Full body coverage this week!**'}

${Object.entries(lastByMuscle).map(([m, ts]) => {
  const h = hoursAgo(ts);
  const status = h < 24 ? '🔴 Fatigued' : h < 72 ? '🟡 Recovering' : '🟢 Ready';
  return `- **${m}:** ${status} (${h < 24 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`})`;
}).join('\n')}

${untrained.length > 0 ? `💡 Consider training **${untrained[0]}** in your next session.` : '💪 You\'re covering all muscle groups — great balanced programming!'}`;
}

function respondSleep(ctx: CoachContext): string {
  const avg = avgSleep(ctx.sleepData);
  const last = ctx.sleepData[ctx.sleepData.length - 1];
  const lastHours = last?.hours ?? 0;

  return `**Your Sleep Analysis 😴**

**Last night:** ${lastHours}h | **7-day average:** ${avg.toFixed(1)}h

${avg >= 8 ? '✅ Excellent! Your sleep is in the optimal recovery zone.' :
  avg >= 7 ? '👍 Good sleep. A little more consistency would maximise recovery.' :
  avg >= 6 ? '⚠️ Slightly below optimal. This may reduce strength gains by up to 15%.' :
  '🔴 Critical: Sleep deprivation this severe significantly impairs recovery, hormones & performance.'}

**Science-backed sleep hygiene tips:**
1. **No screens 45 min before bed** — blue light suppresses melatonin
2. **Keep room below 19°C** — core temp drop triggers deep sleep
3. **Consistent wake time** — even weekends, this anchors your circadian rhythm
4. **Magnesium glycinate 400mg** before bed — clinically proven to improve deep sleep
5. **No caffeine after 2pm** — caffeine half-life is 5–7 hours

**Your target:** Aim for **7.5–9h** nightly. Even 30 more minutes will noticeably improve your gym performance.`;
}

function respondRecovery(ctx: CoachContext): string {
  const recent = recentSets(ctx.workoutSets, 24);
  const muscles = [...new Set(recent.map(s => s.muscleGroup))];

  return `Recovery is where the gains actually happen. 🔧

${muscles.length > 0
  ? `Your **${muscles.join(' and ')}** trained in the last 24 hours need 48–72h before being trained hard again.`
  : 'No recent intense training — this is a good sign your recovery is on track.'}

**Active Recovery Protocol:**
- 🏃 10–15 min light walk or cycle (increases blood flow without stress)
- 🧘 10 min static stretching (hold each stretch 30–45 seconds)
- 🛁 Contrast therapy: 3 min hot → 30 sec cold shower × 3 rounds
- 🍒 **Foods that speed recovery:** tart cherry juice, ginger tea, turmeric, salmon (omega-3)
- 💤 Prioritise 8+ hours of sleep tonight

The 3D model on your dashboard shows which muscles are **red (fatigued)** vs **blue (ready)**. Use it to pick tomorrow's training focus.`;
}

function respondMotivation(ctx: CoachContext): string {
  const { profile } = ctx;
  const days = Math.floor((Date.now() - (new Date(profile.created_at ?? Date.now()).getTime())) / 86400_000);
  return `I see you, and I want you to know — showing up when you don't feel like it is the actual work. 💙

${days > 0 ? `You've been on this journey for **${days} days**. That's not nothing.` : 'Every expert was once a beginner. Your journey starts now.'}

**When motivation fails, systems win.** Here's what to do right now:

1. **The 5-minute rule:** Just start. Put on your shoes. 5 minutes on the treadmill. Motivation follows action, not the other way around.
2. **Lower the bar intentionally:** Tell yourself you'll just do 1 set of each exercise. Often you'll do the full session.
3. **Visualise your goal:** ${profile.goal === 'lose' ? 'Picture yourself at your target weight — lighter, more energetic.' : profile.goal === 'gain' ? 'Visualise the strength and muscle you are building right now.' : 'Picture feeling fit, balanced and energetic every single day.'}
4. **Track your wins:** Every logged set in the Overload Tracker is proof you showed up.

You are one session away from feeling better. Let's go. 🔥`;
}

function respondHydration(ctx: CoachContext): string {
  const { profile } = ctx;
  const target = Math.round(profile.weight_kg * 0.035 * 10) / 10;
  return `**Hydration is your most underrated performance tool. 💧**

**Your personalised target:** **${target}L/day** (based on your ${profile.weight_kg}kg bodyweight)

**Why it matters:**
- Even 2% dehydration reduces strength output by up to **10%**
- Hydration directly impacts sleep quality and recovery speed
- Properly hydrated muscles resist injury better

**Practical tips:**
- 🌅 Start each morning with **500ml water before coffee**
- ⏱️ Set a reminder every 90 minutes to drink 300ml
- 🏋️ During training: **500–750ml per hour** of exercise
- 🌙 Stop drinking large quantities 2h before bed to protect sleep

Use the **Water Intake widget** on your dashboard to track throughout the day. Click the + button every time you finish a glass!`;
}

function respondProgress(ctx: CoachContext): string {
  const recent = recentSets(ctx.workoutSets, 168);
  const sets7d = recent.length;
  const vol7d = recent.reduce((sum, s) => sum + s.weight * s.reps, 0);

  return `**Your Progress Report 📈**

**This week:** ${sets7d} sets logged | ${Math.round(vol7d).toLocaleString()}kg total volume

${sets7d >= 15 ? '🔥 Exceptional training volume this week!' :
  sets7d >= 8 ? '💪 Solid week of training.' :
  sets7d >= 3 ? '👍 Getting started — consistency is key.' :
  '📌 Log some sets in the Overload Tracker to start tracking your progress.'}

**How to measure real progress:**
1. **Strength gains:** Beat your last session's weight or reps (the Overload Tracker shows 🏆 when you do)
2. **Volume increase:** Aim for 5–10% more total volume each week
3. **Recovery speed:** Notice when soreness goes from 3 days to 1.5 days — that's fitness
4. **Consistency score:** How many of your planned sessions did you complete?

**The compound effect:** Improving by just 1% each session means you'll be **37× better** after one year. Every logged set compounds. 🧪`;
}

function respondMental(_ctx: CoachContext): string {
  return `Your mental state is as important as your training load. 🧠

**When you're feeling stressed or burnt out:**

1. **Reframe your workout as self-care, not obligation.** You're not training *for* something — you're training to be fully alive.
2. **Reduce intensity, not frequency.** A 20-min walk still counts. Keep the habit alive even when motivation is zero.
3. **The gym is proven to reduce cortisol.** Even one session measurably reduces stress hormones for 24 hours.
4. **Physical stress relief:** 10 deep breaths → 10 jumping jacks → check in with yourself. Works every time.

**Consider:**
- 📓 Keep a training journal — write 3 wins from each session, no matter how small
- 🎵 Create a high-energy playlist that signals "gym mode" to your brain
- 🤝 Find a training partner — accountability is the most powerful motivator

You're doing the hard thing by being here. That already makes you ahead of the curve. 💙`;
}

function respondGeneral(ctx: CoachContext): string {
  const { profile } = ctx;
  const mode = profile.training_mode ?? 'power';
  const avg = avgSleep(ctx.sleepData);
  const recent = recentSets(ctx.workoutSets, 24);
  return `I'm your **Aura Bio-Coach**, here to give you personalised guidance based on your metrics. 🤖

**Your current snapshot:**
- 🎯 Goal: **${profile.goal === 'lose' ? 'Fat Loss' : profile.goal === 'gain' ? 'Muscle Gain' : 'Maintenance'}**
- ⚡ Training Mode: **${mode.charAt(0).toUpperCase() + mode.slice(1)}**
- 😴 Avg Sleep: **${avg.toFixed(1)}h**
- 🏋️ Sets today: **${recent.length}**
- 🌱 Diet: **${profile.dietary_preference.replace('_', '-')}**

**Try asking me:**
- *"I'm feeling tired today"*
- *"What should I eat for protein?"*
- *"What workout should I do?"*
- *"How's my recovery looking?"*
- *"I need motivation"*`;
}

function respondGreet(ctx: CoachContext): string {
  const { profile } = ctx;
  const avg = avgSleep(ctx.sleepData);
  const recent = recentSets(ctx.workoutSets, 24);
  const mode = profile.training_mode ?? 'power';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const sleepAlert = avg < 6.5
    ? `\n⚠️ **Sleep alert:** You averaged only ${avg.toFixed(1)}h recently. Consider a Recovery session today.`
    : '';
  const trainingNote = recent.length > 0
    ? `\n💪 You've already logged **${recent.length} sets** today — great consistency!`
    : `\n📌 No sets logged yet today. Ready to train?`;

  return `Good ${greeting}, **${profile.name.split(' ')[0]}**! 👋

I'm your **Aura Bio-Coach** — your AI training partner. I have access to your current metrics and I'm here to help you optimise every aspect of your health.${sleepAlert}${trainingNote}

**Active Mode:** ⚡ ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode

What would you like help with today? You can ask me about your diet, training, sleep, recovery, or anything fitness-related!`;
}

function respondSupplements(ctx: CoachContext): string {
  const { profile } = ctx;
  const veg = isVeg(profile);
  return `**Supplements 101 — What Actually Works 💊**

Here's an honest, science-backed breakdown of the most common supplements:

| Supplement | Evidence Level | Best For | Timing |
|---|---|---|---|
| **Creatine Monohydrate** | ⭐⭐⭐⭐⭐ Tier 1 | Strength & power | 5g daily, any time |
| **Whey/Plant Protein** | ⭐⭐⭐⭐ | Hitting protein targets | Post-workout or before bed |
| **Caffeine** | ⭐⭐⭐⭐ | Energy & endurance | 30–60 min pre-workout |
| **Vitamin D3** | ⭐⭐⭐⭐ | Recovery, immunity, mood | Morning with fat |
| **Omega-3 Fish Oil** | ⭐⭐⭐ | Inflammation & joints | With meals |
| **Magnesium Glycinate** | ⭐⭐⭐ | Deep sleep & recovery | 400mg before bed |
| **BCAA** | ⭐⭐ | Minimal benefit if protein is adequate | Skip if budget is tight |

${veg ? `**For vegetarians:** Consider a **plant-based protein powder** (pea + rice blend is the best combo) and **B12 supplementation** which is often deficient in veg diets.` : `**For non-veg:** You likely get enough through food. Focus on **Creatine + Vit D** as your priority stack.`}

💡 **My #1 recommendation:** Creatine monohydrate is the single most researched and effective supplement. 5g/day, no cycling needed.`;
}

function respondCardio(ctx: CoachContext): string {
  const { profile } = ctx;
  const mode = profile.training_mode ?? 'power';
  return `**Cardio Guide — Tailored to Your Training Mode 🏃**

${mode === 'power'
  ? `You're in **Power Mode** — cardio should *support*, not *sabotage*, your strength gains.
  
**Recommended Approach:**
- **2–3× per week** of low-intensity cardio (Zone 2)
- Best options: 30-min brisk walk, cycling, or swimming
- **Avoid** long HIIT sessions on the same day as heavy lifts
- Space cardio 6+ hours away from resistance training if possible

**Why:** Concurrent training (weights + cardio same day) can reduce strength adaptations by up to 20% if overdone.`
  : mode === 'endurance'
  ? `You're in **Endurance Mode** — cardio *is* your main training.
  
**Recommended Structure:**
- **Zone 2 (conversational pace):** 3–4× per week, 40–60 min
- **Tempo run:** 1× per week at a "comfortably hard" pace
- **HIIT:** 1× per week max (e.g., 8×30s sprints, 90s rest)
- **Recovery walk:** any day, light movement keeps blood flowing`
  : `You're in **Recovery Mode** — keep cardio gentle.
  
- Light walks (20–30 min) are ideal
- Swimming is excellent — zero joint impact
- Avoid high-intensity cardio until recovered`}

**Calorie burn estimate per hour:**
- Running (10 km/h): ~${Math.round(profile.weight_kg * 9)} kcal
- Cycling (moderate): ~${Math.round(profile.weight_kg * 7)} kcal
- Swimming (moderate): ~${Math.round(profile.weight_kg * 8)} kcal
- Walking (6 km/h): ~${Math.round(profile.weight_kg * 4)} kcal`;
}

function respondIndian(ctx: CoachContext): string {
  const { profile } = ctx;
  const veg = isVeg(profile);
  return `**Indian Diet for ${profile.goal === 'lose' ? 'Fat Loss' : profile.goal === 'gain' ? 'Muscle Gain' : 'Maintenance'} 🇮🇳**

Great news — Indian food is incredibly fitness-friendly when chosen right!

**High-Protein Indian Foods:**
${veg
  ? `| Food | Protein | Notes |
|---|---|---|
| **Paneer (100g)** | 18g | Best veg protein source |
| **Soya Chunks (cooked, 100g)** | 20g | Budget-friendly powerhouse |
| **Moong Dal Cheela (2 pcs)** | 14g | Perfect breakfast |
| **Rajma / Chana Masala** | 12–15g per bowl | Complete with rice |
| **Greek Yogurt / Thick Dahi** | 10g per bowl | Great snack |
| **Tofu Bhurji** | 14g | Easy scrambled tofu replacement |`
  : `| Food | Protein | Notes |
|---|---|---|
| **Chicken Breast (150g)** | 42g | Lean, highest density |
| **Egg Bhurji (3 eggs)** | 18g | Quick, complete protein |
| **Mutton (150g)** | 30g | High in zinc and iron |
| **Fish Curry (150g)** | 28g | Omega-3 rich |
| **Paneer (100g)** | 18g | Great addition to any meal |`}

**What to limit:**
- 🍞 Too many rotis/rice at once — carbs are fine, but control portions
- 🧈 Excess ghee and butter — use a measured teaspoon, not a ladle
- 🍟 Deep-fried pakoras, puris, and samosas daily — reserve for weekends

**Smart swaps:**
- Aloo paratha → **Besan/Moong cheela** (3× more protein)
- White rice → **Jeera rice with less rice + more dal**
- Fried snacks → **Roasted chana or makhana**

💡 Your goal: Make **dal/paneer/eggs the centerpiece** of every meal, and rotis the side dish — not the other way around.`;
}

function respondBMI(ctx: CoachContext): string {
  const { profile } = ctx;
  const bmi = profile.weight_kg / Math.pow(profile.height_cm / 100, 2);
  const bmiVal = bmi.toFixed(1);
  const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy Weight' : bmi < 30 ? 'Overweight' : 'Obese';
  const idealWeight = Math.round(22.5 * Math.pow(profile.height_cm / 100, 2));

  return `**Your Body Composition Analysis 📊**

**Current BMI:** ${bmiVal} — **${category}**
**Your Height:** ${profile.height_cm}cm | **Weight:** ${profile.weight_kg}kg
**Ideal Weight Range:** ${Math.round(18.5 * Math.pow(profile.height_cm / 100, 2))}–${Math.round(25 * Math.pow(profile.height_cm / 100, 2))} kg
**Target Weight (BMI 22.5):** ~${idealWeight} kg

${bmi < 18.5
  ? `⚠️ You are **underweight**. Priority: eat in a caloric surplus of 300–500 kcal/day. Focus on strength training to build lean mass, not just gaining fat.`
  : bmi < 25
  ? `✅ You are in the **healthy BMI range**. Your goal is now about body composition — building muscle while maintaining or slightly cutting fat.`
  : bmi < 30
  ? `📌 You are **overweight**. A **500 kcal daily deficit** will lead to ~0.5kg fat loss per week. Prioritise strength training to preserve muscle while losing fat.`
  : `🔴 Your BMI indicates **obesity**. This increases risk of cardiovascular disease, diabetes, and joint issues. Start with walking 30 min/day and a 500 kcal deficit. Small consistent steps matter most.`}

> ⚠️ **Note:** BMI doesn't account for muscle mass. Athletes and muscular individuals will show a higher BMI even at low body fat. Use it as a rough guide, not a definitive measure.`;
}

function respondBeginner(_ctx: CoachContext): string {
  return `Welcome to your fitness journey! 🎉 Starting is the hardest part — and you've already done it.

**Week 1–4: The Foundation Phase**

✅ **Training:** Start with 3 days/week full-body workouts
✅ **Focus on the Big 4 movements:** Squat, Hinge (deadlift/RDL), Push (bench/pushup), Pull (row/pulldown)
✅ **Sets & Reps:** 3 sets × 8–12 reps per exercise
✅ **Rest:** 60–90 seconds between sets

**The Golden Rules for Beginners:**
1. **Consistency > Intensity** — 3 mediocre workouts beat 1 perfect one
2. **Form first, weight second** — bad form builds bad habits and causes injury
3. **Progressive overload** — add a tiny bit more weight or reps every session
4. **Don't skip protein** — aim for at least 1.2g per kg of bodyweight
5. **Sleep is where you grow** — 7–9 hours is non-negotiable

**What NOT to do:**
- ❌ Don't skip beginner programs for advanced splits
- ❌ Don't buy every supplement — just eat well and be consistent
- ❌ Don't train 6 days a week — you'll burn out

**Your first workout:**
- Goblet Squat: 3×12
- Push-ups or Bench Press: 3×10
- Lat Pulldown or Dumbbell Row: 3×12
- Plank: 3×30 seconds

You've got this. 💪 Log your first session in the **Overload Tracker** above!`;
}

function respondHowTo(ctx: CoachContext): string {
  const { profile } = ctx;
  const msg = ctx.message.toLowerCase();
  const target = Math.round(profile.weight_kg * (profile.goal === 'lose' ? 2.2 : 1.8));
  const water = Math.round(profile.weight_kg * 0.035 * 10) / 10;

  if (/protein/.test(msg)) return `Eat **${target}g of protein per day**, spread across 3–4 meals. Each meal should have a palm-sized protein source.`;
  if (/water|drink/.test(msg)) return `Drink **${water}L of water per day** for your ${profile.weight_kg}kg body weight. Start with 500ml every morning before coffee.`;
  if (/sleep/.test(msg)) return `Aim for **7.5–9 hours** every night. Go to bed and wake at the same time daily — consistency matters more than duration.`;
  if (/eat|meal/.test(msg)) return `Eat **every 3–4 hours**, aiming for 3 main meals + 1 snack. Each meal: protein source + vegetables + moderate carbs.`;
  if (/workout|train|gym/.test(msg)) return `Train **3–5 days per week** based on your recovery. Beginners: 3 full-body days. Intermediate: 4-day upper/lower split.`;
  if (/cardio/.test(msg)) return `Do **150–300 minutes of moderate cardio** per week. That's just 30 min, 5 days a week. Zone 2 (conversational pace) is ideal for fat loss and heart health.`;

  return `**Key numbers personalised for you (${profile.weight_kg}kg):**
- 💧 Water: **${water}L/day**
- 🥩 Protein: **${target}g/day**
- 😴 Sleep: **7.5–9 hours/night**
- 🏋️ Training: **3–5 days/week**
- 🔥 Calories: **${profile.goal === 'lose' ? 'In a 400–500 kcal deficit' : profile.goal === 'gain' ? 'In a 300–400 kcal surplus' : 'At maintenance (TDEE)'}**`;
}

// ─── Main Engine ─────────────────────────────────────────────────────────────

export function runCoachEngine(ctx: CoachContext): CoachResponse {
  const intent = detectIntent(ctx.message);

  const responders: Record<string, (c: CoachContext) => string> = {
    tired: respondTired,
    protein: respondProtein,
    sleep: respondSleep,
    motivation: respondMotivation,
    meal: respondMeal,
    workout: respondWorkout,
    weight: respondProgress,
    recovery: respondRecovery,
    hydration: respondHydration,
    progress: respondProgress,
    greet: respondGreet,
    mental: respondMental,
    supplements: respondSupplements,
    cardio: respondCardio,
    indian: respondIndian,
    bmi: respondBMI,
    beginner: respondBeginner,
    howto: respondHowTo,
    general: respondGeneral,
  };

  const fn = responders[intent] ?? respondGeneral;
  return { text: fn(ctx) };
}
