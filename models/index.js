import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5434,
    dialect: 'postgres'
  }
);

// Import models
import UserModel from './user.js';
import WorkoutCategoryModel from './workout_category.js';
import ExerciseModel from './exercise.js';
import WorkoutPlanModel from './workout_plan.js';
import WorkoutPlanExerciseModel from './workout_plan_exercise.js';
import ScheduledWorkoutModel from './scheduled_workout.js';
import WorkoutLogModel from './workout_log.js';
import PersonalRecordModel from './personal_record.js';

// Initialize models
const User = UserModel(sequelize, DataTypes);
const WorkoutCategory = WorkoutCategoryModel(sequelize, DataTypes);
const Exercise = ExerciseModel(sequelize, DataTypes);
const WorkoutPlan = WorkoutPlanModel(sequelize, DataTypes);
const WorkoutPlanExercise = WorkoutPlanExerciseModel(sequelize, DataTypes);
const ScheduledWorkout = ScheduledWorkoutModel(sequelize, DataTypes);
const WorkoutLog = WorkoutLogModel(sequelize, DataTypes);
const PersonalRecord = PersonalRecordModel(sequelize, DataTypes);

// =============================================
// Define Associations
// =============================================

// User ↔ Exercise (created_by)
User.hasMany(Exercise, { foreignKey: 'created_by', as: 'createdExercises' });
Exercise.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// WorkoutCategory ↔ Exercise
WorkoutCategory.hasMany(Exercise, { foreignKey: 'category_id', as: 'exercises' });
Exercise.belongsTo(WorkoutCategory, { foreignKey: 'category_id', as: 'category' });

// User ↔ WorkoutPlan
User.hasMany(WorkoutPlan, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'workoutPlans' });
WorkoutPlan.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// WorkoutPlan ↔ WorkoutPlanExercise ↔ Exercise
WorkoutPlan.hasMany(WorkoutPlanExercise, { foreignKey: 'workout_plan_id', onDelete: 'CASCADE', as: 'planExercises' });
WorkoutPlanExercise.belongsTo(WorkoutPlan, { foreignKey: 'workout_plan_id', as: 'plan' });

Exercise.hasMany(WorkoutPlanExercise, { foreignKey: 'exercise_id', as: 'planUsages' });
WorkoutPlanExercise.belongsTo(Exercise, { foreignKey: 'exercise_id', as: 'exercise' });

// User ↔ ScheduledWorkout
User.hasMany(ScheduledWorkout, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'scheduledWorkouts' });
ScheduledWorkout.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// WorkoutPlan ↔ ScheduledWorkout
WorkoutPlan.hasMany(ScheduledWorkout, { foreignKey: 'workout_plan_id', onDelete: 'SET NULL', as: 'scheduledWorkouts' });
ScheduledWorkout.belongsTo(WorkoutPlan, { foreignKey: 'workout_plan_id', as: 'workoutPlan' });

// ScheduledWorkout ↔ WorkoutLog
ScheduledWorkout.hasMany(WorkoutLog, { foreignKey: 'scheduled_workout_id', onDelete: 'CASCADE', as: 'logs' });
WorkoutLog.belongsTo(ScheduledWorkout, { foreignKey: 'scheduled_workout_id', as: 'scheduledWorkout' });

// Exercise ↔ WorkoutLog
Exercise.hasMany(WorkoutLog, { foreignKey: 'exercise_id', as: 'logs' });
WorkoutLog.belongsTo(Exercise, { foreignKey: 'exercise_id', as: 'exercise' });

// User ↔ PersonalRecord
User.hasMany(PersonalRecord, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'personalRecords' });
PersonalRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Exercise ↔ PersonalRecord
Exercise.hasMany(PersonalRecord, { foreignKey: 'exercise_id', as: 'records' });
PersonalRecord.belongsTo(Exercise, { foreignKey: 'exercise_id', as: 'exercise' });

// WorkoutLog ↔ PersonalRecord (optional, tracks which workout set the PR)
WorkoutLog.hasMany(PersonalRecord, { foreignKey: 'source_log_id', as: 'recordsSet' });
PersonalRecord.belongsTo(WorkoutLog, { foreignKey: 'source_log_id', as: 'sourceLog' });

export { 
  sequelize, 
  User, 
  WorkoutCategory, 
  Exercise, 
  WorkoutPlan, 
  WorkoutPlanExercise, 
  ScheduledWorkout, 
  WorkoutLog, 
  PersonalRecord
};