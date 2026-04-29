
-- WORKOUT LOGS
CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise text NOT NULL,
  muscle_group text NOT NULL,
  weight numeric NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 0,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout logs"
  ON workout_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SLEEP LOGS
CREATE TABLE IF NOT EXISTS sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric NOT NULL CHECK (hours >= 0 AND hours <= 24),
  mood text NOT NULL CHECK (mood IN ('great', 'good', 'okay', 'poor')),
  UNIQUE(user_id, date)
);

ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sleep logs"
  ON sleep_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- COACH HISTORY
CREATE TABLE IF NOT EXISTS coach_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'coach')),
  text text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE coach_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own coach history"
  ON coach_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DAILY METRICS
CREATE TABLE IF NOT EXISTS daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  water_liters numeric NOT NULL DEFAULT 0,
  steps integer NOT NULL DEFAULT 0,
  calories_consumed integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily metrics"
  ON daily_metrics FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
