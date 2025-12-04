import { v4 as uuidv4 } from 'uuid';
import { sequelize, User, WorkoutCategory, Exercise } from '../models/index.js';
import bcrypt from 'bcryptjs';

async function seedData() {
  try {
    // Sync database (force: true will drop and recreate tables)
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // =============================================
    // 1. Seed Workout Categories
    // =============================================
    await WorkoutCategory.bulkCreate([
      { id: '00000000-0000-0000-0000-000000000001', name: 'Muscle Group', description: 'Resistance and weight training exercises' },
      { id: '00000000-0000-0000-0000-000000000002', name: 'Strengthening', description: 'Bodyweight and functional strength exercises' },
      { id: '00000000-0000-0000-0000-000000000003', name: 'Flexibility', description: 'Stretching and mobility exercises' }
    ]);
    console.log('Categories seeded');

    // =============================================
    // 2. Seed Demo User (optional)
    // =============================================
    const hashedPassword = await bcrypt.hash('demo123', 10);
    await User.create({
      id: '00000000-0000-0000-0000-000000000100',
      username: 'demo_user',
      email: 'demo@example.com',
      fullname: 'Demo User',
      passwordHash: hashedPassword,
     
    });
    console.log('Demo user created');

    // =============================================
    // 3. Seed Exercises (80+ from your SQL)
    // =============================================
    const exercises = [
      // ██████████████████  MUSCLE GROUP (1) ██████████████████
      {  name: 'Barbell Back Squat', description: 'King of lower-body exercises', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 8, defaultWeight: 80, defaultRestSeconds: 180, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Conventional Deadlift', description: 'Full posterior chain', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 5, defaultWeight: 120, defaultRestSeconds: 180, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Bench Press (Barbell)', description: 'Primary chest builder', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 8, defaultWeight: 60, defaultRestSeconds: 120, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Overhead Press (Standing)', description: 'Shoulders & triceps', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 8, defaultWeight: 40, defaultRestSeconds: 120, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Pull-Up / Chin-Up', description: 'Best back & biceps', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 8, defaultWeight: null, defaultRestSeconds: 90, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Bent-Over Row (Barbell)', description: 'Upper back thickness', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 8, defaultWeight: 60, defaultRestSeconds: 120, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Romanian Deadlift', description: 'Hamstrings & glutes', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 10, defaultWeight: 80, defaultRestSeconds: 120, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Hip Thrust (Barbell)', description: 'Glute dominant', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 12, defaultWeight: 100, defaultRestSeconds: 90, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Leg Press', description: 'Quad-focused', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 12, defaultWeight: 150, defaultRestSeconds: 90, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Bulgarian Split Squat', description: 'Unilateral quads & glutes', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 3, defaultReps: 10, defaultWeight: 20, defaultRestSeconds: 90, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Dumbbell Lateral Raise', description: 'Side delts', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 3, defaultReps: 12, defaultWeight: 8, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Face Pull', description: 'Rear delts & rotator cuff', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 3, defaultReps: 15, defaultWeight: 10, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Incline Bench Press', description: 'Upper chest', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 10, defaultWeight: 50, defaultRestSeconds: 120, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Lat Pulldown', description: 'Back width (pull-up alternative)', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 12, defaultWeight: 50, defaultRestSeconds: 90, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Seated Cable Row', description: 'Mid-back', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 12, defaultWeight: 60, defaultRestSeconds: 90, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Dumbbell Curl', description: 'Biceps', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 3, defaultReps: 12, defaultWeight: 12, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Tricep Pushdown', description: 'Triceps isolation', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 3, defaultReps: 15, defaultWeight: 20, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },

      // ██████████████████  STRENGTHENING (2) ██████████████████
      {  name: 'Push-Up', description: 'Bodyweight chest & triceps', category_id: '00000000-0000-0000-0000-000000000002', defaultSets: 3, defaultReps: 15, defaultWeight: null, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Dip (Parallel Bars)', description: 'Chest & triceps', category_id: '00000000-0000-0000-0000-000000000002', defaultSets: 4, defaultReps: 10, defaultWeight: null, defaultRestSeconds: 90, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Pike Push-Up', description: 'Shoulder strength', category_id: '00000000-0000-0000-0000-000000000002', defaultSets: 3, defaultReps: 12, defaultWeight: null, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Inverted Row', description: 'Horizontal pulling', category_id: '00000000-0000-0000-0000-000000000002', defaultSets: 4, defaultReps: 12, defaultWeight: null, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Goblet Squat', description: 'Beginner squat progression', category_id: '00000000-0000-0000-0000-000000000002', defaultSets: 3, defaultReps: 12, defaultWeight: 16, defaultRestSeconds: 90, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Kettlebell Swing', description: 'Posterior chain power', category_id: '00000000-0000-0000-0000-000000000002', defaultSets: 4, defaultReps: 20, defaultWeight: 24, defaultRestSeconds: 45, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Turkish Get-Up', description: 'Full-body strength & stability', category_id: '00000000-0000-0000-0000-000000000002', defaultSets: 3, defaultReps: 5, defaultWeight: 16, defaultRestSeconds: 120, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Farmer\'s Carry', description: 'Grip & core', category_id: '00000000-0000-0000-0000-000000000002', defaultSets: 3, defaultReps: null, defaultWeight: 40, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Plank', description: 'Core anti-extension', category_id: '00000000-0000-0000-0000-000000000002', defaultSets: 3, defaultReps: null, defaultWeight: null, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Dead Bug', description: 'Core stability', category_id: '00000000-0000-0000-0000-000000000002', defaultSets: 3, defaultReps: 12, defaultWeight: null, defaultRestSeconds: 45, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Hanging Leg Raise', description: 'Lower abs', category_id: '00000000-0000-0000-0000-000000000002', defaultSets: 3, defaultReps: 12, defaultWeight: null, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },

      // ██████████████████  FLEXIBILITY / MOBILITY (3) ██████████████████
      {  name: 'Downward Dog', description: 'Full-body stretch', category_id: '00000000-0000-0000-0000-000000000003', defaultSets: 1, defaultReps: null, defaultWeight: null, defaultRestSeconds: 30, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Cat-Cow Pose', description: 'Spine mobility', category_id: '00000000-0000-0000-0000-000000000003', defaultSets: 1, defaultReps: 10, defaultWeight: null, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Child\'s Pose', description: 'Lower back & hips', category_id: '00000000-0000-0000-0000-000000000003', defaultSets: 1, defaultReps: null, defaultWeight: null, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Pigeon Pose', description: 'Hip & glute stretch', category_id: '00000000-0000-0000-0000-000000000003', defaultSets: 1, defaultReps: null, defaultWeight: null, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Couch Stretch', description: 'Quad & hip flexor', category_id: '00000000-0000-0000-0000-000000000003', defaultSets: 1, defaultReps: null, defaultWeight: null, defaultRestSeconds: 120, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: '90/90 Hip Stretch', description: 'Internal & external rotation', category_id: '00000000-0000-0000-0000-000000000003', defaultSets: 1, defaultReps: null, defaultWeight: null, defaultRestSeconds: 90, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Thread the Needle', description: 'Upper back & shoulders', category_id: '00000000-0000-0000-0000-000000000003', defaultSets: 1, defaultReps: null, defaultWeight: null, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'World\'s Greatest Stretch', description: 'Full lower-body chain', category_id: '00000000-0000-0000-0000-000000000003', defaultSets: 1, defaultReps: 8, defaultWeight: null, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Frog Stretch', description: 'Adductors & hips', category_id: '00000000-0000-0000-0000-000000000003', defaultSets: 1, defaultReps: null, defaultWeight: null, defaultRestSeconds: 120, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      {  name: 'Seated Forward Fold', description: 'Hamstrings & spine', category_id: '00000000-0000-0000-0000-000000000003', defaultSets: 1, defaultReps: null, defaultWeight: null, defaultRestSeconds: 90, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },

      // Bonus popular ones (Muscle Group)
      { name: 'Sumo Deadlift', description: 'Inner thighs & glutes', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 6, defaultWeight: 100, defaultRestSeconds: 180, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      { name: 'Close-Grip Bench Press', description: 'Triceps emphasis', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 10, defaultWeight: 50, defaultRestSeconds: 120, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      { name: 'Pendlay Row', description: 'Explosive back', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 4, defaultReps: 8, defaultWeight: 70, defaultRestSeconds: 120, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      { name: 'Deficit Deadlift', description: 'More range of motion', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 3, defaultReps: 5, defaultWeight: 100, defaultRestSeconds: 180, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true },
      { name: 'Lunges (Walking)', description: 'Unilateral legs', category_id: '00000000-0000-0000-0000-000000000001', defaultSets: 3, defaultReps: 12, defaultWeight: 20, defaultRestSeconds: 60, created_by: '00000000-0000-0000-0000-000000000100', isPublic: true }
    ];

    await Exercise.bulkCreate(exercises);
    console.log(`✅ ${exercises.length} exercises seeded`);

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

export default seedData;