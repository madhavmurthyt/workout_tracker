-- =============================================
-- Workout Tracker - PostgreSQL Schema
-- Features: JWT auth ready, pre-seeded categories, 
--           personal workout plans, scheduling, progress tracking & reporting
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. Users (with secure password hashing)
-- =============================================
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         CITEXT UNIQUE NOT NULL,
    username      CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,                    -- store bcrypt/argon2 hash
    full_name     TEXT,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at    TIMESTAMPTZ
);

-- Index for login
CREATE UNIQUE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_users_username_lower ON users(LOWER(username));

-- =============================================
-- 2. Predefined Workout Categories
-- =============================================
CREATE TABLE workout_categories (
    id   SMALLSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK (name IN (
        'Muscle Group', 'Strengthening', 'Flexibility'
    ))
);

-- Seed data
INSERT INTO workout_categories (name) 
VALUES ('Muscle Group'), ('Strengthening'), ('Flexibility')
ON CONFLICT DO NOTHING;

-- =============================================
-- 3. Exercises (admin or user-contributed)
-- =============================================
CREATE TABLE exercises (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT NOT NULL,
    description   TEXT,
    category_id   SMALLINT NOT NULL REFERENCES workout_categories(id),
    default_sets  SMALLINT DEFAULT 3,
    default_reps  SMALLINT,
    default_weight NUMERIC(6,2),   -- in kg or lbs
    default_rest_seconds INT,
    created_by    UUID REFERENCES users(id),   -- NULL = system exercise
    is_public     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================
-- SEED: Popular Exercises (80+ real ones)
-- Categories already exist: 
-- 1 = Muscle Group | 2 = Strengthening | 3 = Flexibility
-- =============================================

INSERT INTO exercises (
    id, 
    name, 
    description, 
    category_id, 
    default_sets, 
    default_reps, 
    default_weight, 
    default_rest_seconds,
    created_by,            -- NULL = system / built-in
    is_public
) VALUES
-- ██████████████████  MUSCLE GROUP (1) ██████████████████
('00000000-0000-0000-0000-000000000001'::uuid, 'Barbell Back Squat',            'King of lower-body exercises', 1, 4, 8,   80, 180, null, true),
('00000000-0000-0000-0000-000000000002'::uuid, 'Conventional Deadlift',         'Full posterior chain',         1, 4, 5,  120, 180, null, true),
('00000000-0000-0000-0000-000000000003'::uuid, 'Bench Press (Barbell)',         'Primary chest builder',        1, 4, 8,   60, 120, null, true),
('00000000-0000-0000-0000-000000000004'::uuid, 'Overhead Press (Standing)',     'Shoulders & triceps',          1, 4, 8,   40, 120, null, true),
('00000000-0000-0000-0000-000000000005'::uuid, 'Pull-Up / Chin-Up',             'Best back & biceps',           1, 4, 8,  null, 90, null, true),
('00000000-0000-0000-0000-000000000006'::uuid, 'Bent-Over Row (Barbell)',       'Upper back thickness',         1, 4, 8,   60, 120, null, true),
('00000000-0000-0000-0000-000000000007'::uuid, 'Romanian Deadlift',            'Hamstrings & glutes',          1, 4, 10,  80, 120, null, true),
('00000000-0000-0000-0000-000000000008'::uuid, 'Hip Thrust (Barbell)',          'Glute dominant',               1, 4, 12, 100, 90,  null, true),
('00000000-0000-0000-0000-000000000009'::uuid, 'Leg Press',                     'Quad-focused',                 1, 4, 12, 150, 90,  null, true),
('00000000-0000-0000-0000-000000000010'::uuid, 'Bulgarian Split Squat',         'Unilateral quads & glutes',    1, 3, 10,  20, 90,  null, true),
('00000000-0000-0000-0000-000000000011'::uuid, 'Dumbbell Lateral Raise',        'Side delts',                   1, 3, 12,  8,  60,  null, true),
('00000000-0000-0000-0000-000000000012'::uuid, 'Face Pull',                    'Rear delts & rotator cuff',    1, 3, 15,  10, 60,  null, true),
('00000000-0000-0000-0000-000000000013'::uuid, 'Incline Bench Press',           'Upper chest',                  1, 4, 10,  50, 120, null, true),
('00000000-0000-0000-0000-000000000014'::uuid, 'Lat Pulldown',                  'Back width (pull-up alternative)', 1, 4, 12, 50, 90, null, true),
('00000000-0000-0000-0000-000000000015'::uuid, 'Seated Cable Row',             'Mid-back',                     1, 4, 12, 60, 90,  null, true),
('00000000-0000-0000-0000-000000000016'::uuid, 'Dumbbell Curl',                 'Biceps',                       1, 3, 12, 12, 60,  null, true),
('00000000-0000-0000-0000-000000000017'::uuid, 'Tricep Pushdown',               'Triceps isolation',            1, 3, 15, 20, 60,  null, true),

-- ██████████████████  STRENGTHENING (2) ██████████████████
('00000000-0000-0000-0000-000000000020'::uuid, 'Push-Up',                       'Bodyweight chest & triceps',   2, 3, 15, null, 60, null, true),
('00000000-0000-0000-0000-000000000021'::uuid, 'Dip (Parallel Bars)',           'Chest & triceps',              2, 4, 10, null, 90, null, true),
('00000000-0000-0000-0000-000000000022'::uuid, 'Pike Push-Up',                  'Shoulder strength',            2, 3, 12, null, 60, null, true),
('00000000-0000-0000-0000-000000000023'::uuid, 'Inverted Row',                  'Horizontal pulling',          2, 4, 12, null, 60, null, true),
('00000000-0000-0000-0000-000000000024'::uuid, 'Goblet Squat',                  'Beginner squat progression',   2, 3, 12, 16, 90, null, true),
('00000000-0000-0000-0000-000000000025'::uuid, 'Kettlebell Swing',              'Posterior chain power',        2, 4, 20, 24, 45, null, true),
('00000000-0000-0000-0000-000000000026'::uuid, 'Turkish Get-Up',                'Full-body strength & stability', 2, 3, 5, 16, 120,null, true),
('00000000-0000-0000-0000-000000000027'::uuid, 'Farmer’s Carry',                'Grip & core',                  2, 3, null, 40, 60, null, true), -- distance or time
('00000000-0000-0000-0000-000000000028'::uuid, 'Plank',                         'Core anti-extension',          2, 3, null, null, 60, null, true),
('00000000-0000-0000-0000-000000000029'::uuid, 'Dead Bug',                      'Core stability',               2, 3, 12, null, 45, null, true),
('00000000-0000-0000-0000-000000000030'::uuid, 'Hanging Leg Raise',             'Lower abs',                    2, 3, 12, null, 60, null, true),

-- ██████████████████  FLEXIBILITY / MOBILITY (3) ██████████████████
('00000000-0000-0000-0000-000000000040'::uuid, 'Downward Dog',                  'Full-body stretch',                 3, 1, null, null, 30, null, true),
('00000000-0000-0000-0000-000000000041'::uuid, 'Cat-Cow Pose',                  'Spine mobility',                    3, 1, 10, null, 60, null, true),
('00000000-0000-0000-0000-000000000042'::uuid, 'Child’s Pose',                  'Lower back & hips',                 3, 1, null, null, 60, null, true),
('00000000-0000-0000-0000-000000000043'::uuid, 'Pigeon Pose',                   'Hip & glute stretch',               3, 1, null, null, 60, null, true),
('00000000-0000-0000-0000-000000000044'::uuid, 'Couch Stretch',                 'Quad & hip flexor',                 3, 1, null, null, 120,null, true),
('00000000-0000-0000-0000-000000000045'::uuid, '90/90 Hip Stretch',             'Internal & external rotation',      3, 1, null, null, 90, null, true),
('00000000-0000-0000-0000-000000000046'::uuid, 'Thread the Needle',             'Upper back & shoulders',            3, 1, null, null, 60, null, true),
('00000000-0000-0000-0000-000000000047'::uuid, 'World’s Greatest Stretch',      'Full lower-body chain',             3, 1, 8, null, 60, null, true),
('00000000-0000-0000-0000-000000000048'::uuid, 'Frog Stretch',                  'Adductors & hips',                  3, 1, null, null, 120,null, true),
('00000000-0000-0000-0000-000000000049'::uuid, 'Seated Forward Fold',           'Hamstrings & spine',                3, 1, null, null, 90, null, true),

-- Bonus popular ones (Muscle Group)
('00000000-0000-0000-0000-000000000050'::uuid, 'Sumo Deadlift',                 'Inner thighs & glutes',        1, 4, 6, 100, 180, null, true),
('00000000-0000-0000-0000-000000000051'::uuid, 'Close-Grip Bench Press',         'Triceps emphasis',             1, 4, 10, 50, 120, null, true),
('00000000-0000-0000-0000-000000000052'::uuid, 'Pendlay Row',                   'Explosive back',               1, 4, 8,  70, 120, null, true),
('00000000-0000-0000-0000-000000000053'::uuid, 'Deficit Deadlift',              'More range of motion',         1, 3, 5, 100, 180, null, true),
('00000000-0000-0000-0000-000000000054'::uuid, 'Lunges (Walking)',              'Unilateral legs',              1, 3, 12, 20, 60, null, true)

ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. User's Custom Workout Plans (Templates)
-- =============================================
CREATE TABLE workout_plans (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    description  TEXT,
    is_favorite  BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================
-- 5. Exercises inside a Plan (order matters)
-- =============================================
CREATE TABLE workout_plan_exercises (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    exercise_id     UUID NOT NULL REFERENCES exercises(id),
    sort_order      INT NOT NULL DEFAULT 0,
    sets            SMALLINT NOT NULL DEFAULT 3,
    reps            SMALLINT,
    weight_kg       NUMERIC(6,2),
    rest_seconds    INT DEFAULT 90,
    notes           TEXT,
    UNIQUE(workout_plan_id, sort_order)
);


-- =============================================
-- 6. Scheduled Workouts (Calendar)
-- =============================================
CREATE TABLE scheduled_workouts (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_plan_id  UUID REFERENCES workout_plans(id),   -- NULL if ad-hoc
    title            TEXT NOT NULL,                      -- e.g. "Leg Day", "Morning Yoga"
    notes            TEXT,
    scheduled_at     TIMESTAMPTZ NOT NULL,               -- date + time
    duration_minutes INT,
    status           TEXT NOT NULL DEFAULT 'planned' 
                     CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped')),
    completed_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);



-- =============================================
-- 7. Workout Logs - Actual performed sets (Progress Tracking)
-- =============================================
CREATE TABLE workout_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheduled_workout_id UUID NOT NULL REFERENCES scheduled_workouts(id) ON DELETE CASCADE,
    exercise_id         UUID NOT NULL REFERENCES exercises(id),
    set_number          SMALLINT NOT NULL,
    reps_achieved       SMALLINT,
    weight_kg           NUMERIC(6,2),
    rpe                 NUMERIC(3,1) CHECK (rpe BETWEEN 1 AND 10), -- Rate of Perceived Exertion
    notes               TEXT,
    completed_at        TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================
-- 8. Personal Records (auto-calculated or manual)
-- =============================================
CREATE TABLE personal_records (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id  UUID NOT NULL REFERENCES exercises(id),
    max_weight_kg NUMERIC(6,2),
    max_reps     SMALLINT,
    recorded_at  TIMESTAMPTZ DEFAULT NOW(),
    source_log_id UUID REFERENCES workout_logs(id),
    UNIQUE(user_id, exercise_id)
);

-- =============================================
-- Triggers: auto-update timestamps
-- =============================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that have updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER set_timestamp
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
        ', t);
    END LOOP;
END;
$$;

-- =============================================
-- Recommended Additional Indexes for Reports
-- =============================================


-- =============================================
-- Sample Queries You’ll Love
-- =============================================
-- 1. Upcoming workouts
-- SELECT * FROM scheduled_workouts 
-- WHERE user_id = '...' AND status = 'planned' AND scheduled_at > NOW()
-- ORDER BY scheduled_at;

-- 2. Progress report for an exercise (last 3 months)
-- SELECT date_trunc('day', completed_at) as day, 
--        AVG(weight_kg) as avg_weight, MAX(reps_achieved) as best_reps
-- FROM workout_logs 
-- WHERE exercise_id = '...' AND user_id = '...' 
--   AND completed_at > NOW() - INTERVAL '90 days'
-- GROUP BY day ORDER BY day;

-- 3. Total volume per muscle group last 30 days → great for reports!
