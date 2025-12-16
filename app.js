import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import seedData from './data/initData.js';
import {
  sequelize,
  User,
  WorkoutCategory,
  Exercise,
  WorkoutPlan,
  WorkoutPlanExercise,
  ScheduledWorkout,
  WorkoutLog,
  PersonalRecord
} from './models/index.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// Token blacklist for logout (in production, use Redis)
const tokenBlacklist = new Set();

app.use(cors());
app.use(express.json());

// =============================================
// JWT Authentication Middleware
// =============================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Token has been invalidated' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    req.token = token;
    next();
  });
};

// =============================================
// AUTH ROUTES
// =============================================

// POST /api/auth/signup - Register new user
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, fullname } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash,
      fullname: fullname || null
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login - Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout - Logout user
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  tokenBlacklist.add(req.token);
  res.json({ message: 'Logged out successfully' });
});

// =============================================
// EXERCISES ROUTES
// =============================================

// GET /api/exercises - List all exercises
app.get('/api/exercises', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    
    const whereClause = { isPublic: true };
    if (category) {
      whereClause['$category.name$'] = category;
    }

    const exercises = await Exercise.findAll({
      where: whereClause,
      include: [{
        model: WorkoutCategory,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order: [['name', 'ASC']]
    });

    res.json({ exercises });
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================
// WORKOUT PLAN ROUTES
// =============================================

// POST /api/workouts - Create workout plan
app.post('/api/workouts', authenticateToken, async (req, res) => {
  try {
    const { name, description, exercises, isFavorite } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Workout name is required' });
    }

    // Create workout plan
    const workoutPlan = await WorkoutPlan.create({
      user_id: req.user.id,
      name,
      description: description || null,
      isFavorite: isFavorite || false
    });

    // Add exercises to workout plan
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      const planExercises = exercises.map((ex, index) => ({
        workout_plan_id: workoutPlan.id,
        exercise_id: ex.exercise_id,
        sort_order: ex.sort_order ?? index,
        sets: ex.sets || 3,
        reps: ex.reps || 10,
        weight_kg: ex.weight_kg || null,
        rest_seconds: ex.rest_seconds || 60,
        notes: ex.notes || null
      }));

      await WorkoutPlanExercise.bulkCreate(planExercises);
    }

    // Fetch the complete workout plan with exercises
    const createdPlan = await WorkoutPlan.findByPk(workoutPlan.id, {
      include: [{
        model: WorkoutPlanExercise,
        as: 'planExercises',
        include: [{
          model: Exercise,
          as: 'exercise',
          include: [{ model: WorkoutCategory, as: 'category' }]
        }]
      }]
    });

    res.status(201).json({
      message: 'Workout plan created successfully',
      workout: createdPlan
    });
  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workouts - List user's workouts (sorted by date)
app.get('/api/workouts', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query; // 'active', 'favorite', 'all'

    const whereClause = { user_id: req.user.id };
    if (status === 'favorite') {
      whereClause.isFavorite = true;
    }

    const workouts = await WorkoutPlan.findAll({
      where: whereClause,
      include: [{
        model: WorkoutPlanExercise,
        as: 'planExercises',
        include: [{
          model: Exercise,
          as: 'exercise',
          include: [{ model: WorkoutCategory, as: 'category' }]
        }]
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ workouts });
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workouts/:id - Get workout details
app.get('/api/workouts/:id', authenticateToken, async (req, res) => {
  try {
    const workout = await WorkoutPlan.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{
        model: WorkoutPlanExercise,
        as: 'planExercises',
        include: [{
          model: Exercise,
          as: 'exercise',
          include: [{ model: WorkoutCategory, as: 'category' }]
        }],
        order: [['sort_order', 'ASC']]
      }]
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    res.json({ workout });
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/workouts/:id - Update workout plan
app.put('/api/workouts/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, exercises, isFavorite, comments } = req.body;

    const workout = await WorkoutPlan.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Update workout plan fields
    await workout.update({
      name: name ?? workout.name,
      description: description !== undefined ? description : workout.description,
      isFavorite: isFavorite ?? workout.isFavorite,
      updated_at: new Date()
    });

    // Update exercises if provided
    if (exercises && Array.isArray(exercises)) {
      // Remove existing exercises
      await WorkoutPlanExercise.destroy({
        where: { workout_plan_id: workout.id }
      });

      // Add new exercises
      const planExercises = exercises.map((ex, index) => ({
        workout_plan_id: workout.id,
        exercise_id: ex.exercise_id,
        sort_order: ex.sort_order ?? index,
        sets: ex.sets || 3,
        reps: ex.reps || 10,
        weight_kg: ex.weight_kg || null,
        rest_seconds: ex.rest_seconds || 60,
        notes: ex.notes || comments || null // Support adding comments
      }));

      await WorkoutPlanExercise.bulkCreate(planExercises);
    }

    // Fetch updated workout
    const updatedWorkout = await WorkoutPlan.findByPk(workout.id, {
      include: [{
        model: WorkoutPlanExercise,
        as: 'planExercises',
        include: [{
          model: Exercise,
          as: 'exercise',
          include: [{ model: WorkoutCategory, as: 'category' }]
        }]
      }]
    });

    res.json({
      message: 'Workout updated successfully',
      workout: updatedWorkout
    });
  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/workouts/:id - Delete workout plan
app.delete('/api/workouts/:id', authenticateToken, async (req, res) => {
  try {
    const workout = await WorkoutPlan.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    await workout.destroy();

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================
// SCHEDULED WORKOUT ROUTES
// =============================================

// POST /api/schedule - Schedule a workout
app.post('/api/schedule', authenticateToken, async (req, res) => {
  try {
    const { workout_plan_id, title, notes, scheduled_at, duration_minutes } = req.body;

    if (!scheduled_at || !title) {
      return res.status(400).json({ error: 'Title and scheduled_at are required' });
    }

    // Verify workout plan belongs to user if provided
    if (workout_plan_id) {
      const workoutPlan = await WorkoutPlan.findOne({
        where: { id: workout_plan_id, user_id: req.user.id }
      });
      if (!workoutPlan) {
        return res.status(404).json({ error: 'Workout plan not found' });
      }
    }

    const scheduledWorkout = await ScheduledWorkout.create({
      user_id: req.user.id,
      workout_plan_id: workout_plan_id || null,
      title,
      notes: notes || null,
      scheduled_at: new Date(scheduled_at),
      duration_minutes: duration_minutes || null,
      status: 'planned'
    });

    res.status(201).json({
      message: 'Workout scheduled successfully',
      scheduledWorkout
    });
  } catch (error) {
    console.error('Schedule workout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/schedule - List scheduled workouts (active/pending, sorted by date)
app.get('/api/schedule', authenticateToken, async (req, res) => {
  try {
    const { status, from, to } = req.query;

    const whereClause = { user_id: req.user.id };
    
    // Filter by status (default: show planned and in_progress)
    if (status) {
      whereClause.status = status;
    } else {
      whereClause.status = { [Op.in]: ['planned', 'in_progress'] };
    }

    // Filter by date range
    if (from || to) {
      whereClause.scheduled_at = {};
      if (from) whereClause.scheduled_at[Op.gte] = new Date(from);
      if (to) whereClause.scheduled_at[Op.lte] = new Date(to);
    }

    const scheduledWorkouts = await ScheduledWorkout.findAll({
      where: whereClause,
      include: [{
        model: WorkoutPlan,
        as: 'workoutPlan',
        include: [{
          model: WorkoutPlanExercise,
          as: 'planExercises',
          include: [{ model: Exercise, as: 'exercise' }]
        }]
      }],
      order: [['scheduled_at', 'ASC']]
    });

    res.json({ scheduledWorkouts });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/schedule/:id - Get scheduled workout details
app.get('/api/schedule/:id', authenticateToken, async (req, res) => {
  try {
    const scheduledWorkout = await ScheduledWorkout.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        {
          model: WorkoutPlan,
          as: 'workoutPlan',
          include: [{
            model: WorkoutPlanExercise,
            as: 'planExercises',
            include: [{ model: Exercise, as: 'exercise' }]
          }]
        },
        {
          model: WorkoutLog,
          as: 'logs',
          include: [{ model: Exercise, as: 'exercise' }]
        }
      ]
    });

    if (!scheduledWorkout) {
      return res.status(404).json({ error: 'Scheduled workout not found' });
    }

    res.json({ scheduledWorkout });
  } catch (error) {
    console.error('Get scheduled workout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/schedule/:id - Update scheduled workout
app.put('/api/schedule/:id', authenticateToken, async (req, res) => {
  try {
    const { title, notes, scheduled_at, duration_minutes, status } = req.body;

    const scheduledWorkout = await ScheduledWorkout.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!scheduledWorkout) {
      return res.status(404).json({ error: 'Scheduled workout not found' });
    }

    const updateData = {
      title: title ?? scheduledWorkout.title,
      notes: notes !== undefined ? notes : scheduledWorkout.notes,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : scheduledWorkout.scheduled_at,
      duration_minutes: duration_minutes ?? scheduledWorkout.duration_minutes,
      updated_at: new Date()
    };

    // Handle status changes
    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date();
      }
    }

    await scheduledWorkout.update(updateData);

    res.json({
      message: 'Scheduled workout updated successfully',
      scheduledWorkout
    });
  } catch (error) {
    console.error('Update scheduled workout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/schedule/:id - Delete scheduled workout
app.delete('/api/schedule/:id', authenticateToken, async (req, res) => {
  try {
    const scheduledWorkout = await ScheduledWorkout.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!scheduledWorkout) {
      return res.status(404).json({ error: 'Scheduled workout not found' });
    }

    await scheduledWorkout.destroy();

    res.json({ message: 'Scheduled workout deleted successfully' });
  } catch (error) {
    console.error('Delete scheduled workout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================
// WORKOUT LOG ROUTES
// =============================================

// POST /api/logs - Log exercise completion
app.post('/api/logs', authenticateToken, async (req, res) => {
  try {
    const { scheduled_workout_id, exercise_id, set_number, reps_achieved, weight_kg, rpe, notes } = req.body;

    if (!scheduled_workout_id || !exercise_id || !set_number) {
      return res.status(400).json({ error: 'scheduled_workout_id, exercise_id, and set_number are required' });
    }

    // Verify scheduled workout belongs to user
    const scheduledWorkout = await ScheduledWorkout.findOne({
      where: { id: scheduled_workout_id, user_id: req.user.id }
    });

    if (!scheduledWorkout) {
      return res.status(404).json({ error: 'Scheduled workout not found' });
    }

    const workoutLog = await WorkoutLog.create({
      scheduled_workout_id,
      exercise_id,
      set_number,
      reps_achieved: reps_achieved || null,
      weight_kg: weight_kg || null,
      rpe: rpe || null,
      notes: notes || null
    });

    // Check and update personal record
    if (weight_kg) {
      const existingPR = await PersonalRecord.findOne({
        where: { user_id: req.user.id, exercise_id }
      });

      if (!existingPR || parseFloat(weight_kg) > parseFloat(existingPR.max_weight_kg || 0)) {
        await PersonalRecord.upsert({
          user_id: req.user.id,
          exercise_id,
          max_weight_kg: weight_kg,
          max_reps: reps_achieved,
          recorded_at: new Date(),
          source_log_id: workoutLog.id
        });
      }
    }

    res.status(201).json({
      message: 'Exercise logged successfully',
      log: workoutLog
    });
  } catch (error) {
    console.error('Log exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/logs/scheduled/:scheduledId - Get logs for a scheduled workout
app.get('/api/logs/scheduled/:scheduledId', authenticateToken, async (req, res) => {
  try {
    // Verify ownership
    const scheduledWorkout = await ScheduledWorkout.findOne({
      where: { id: req.params.scheduledId, user_id: req.user.id }
    });

    if (!scheduledWorkout) {
      return res.status(404).json({ error: 'Scheduled workout not found' });
    }

    const logs = await WorkoutLog.findAll({
      where: { scheduled_workout_id: req.params.scheduledId },
      include: [{ model: Exercise, as: 'exercise' }],
      order: [['exercise_id', 'ASC'], ['set_number', 'ASC']]
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================
// REPORTS ROUTES
// =============================================

// GET /api/reports/summary - User's workout summary
app.get('/api/reports/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Total completed workouts
    const totalWorkouts = await ScheduledWorkout.count({
      where: { user_id: userId, status: 'completed' }
    });

    // Total workout duration
    const durationResult = await ScheduledWorkout.sum('duration_minutes', {
      where: { user_id: userId, status: 'completed' }
    });

    // Workouts this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const workoutsThisWeek = await ScheduledWorkout.count({
      where: {
        user_id: userId,
        status: 'completed',
        completed_at: { [Op.gte]: startOfWeek }
      }
    });

    // Workouts this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const workoutsThisMonth = await ScheduledWorkout.count({
      where: {
        user_id: userId,
        status: 'completed',
        completed_at: { [Op.gte]: startOfMonth }
      }
    });

    // Total exercises logged
    const totalExercisesLogged = await WorkoutLog.count({
      include: [{
        model: ScheduledWorkout,
        as: 'scheduledWorkout',
        where: { user_id: userId },
        required: true
      }]
    });

    // Favorite workout category
    const categoryStats = await WorkoutLog.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('WorkoutLog.id')), 'count']
      ],
      include: [
        {
          model: ScheduledWorkout,
          as: 'scheduledWorkout',
          where: { user_id: userId },
          attributes: [],
          required: true
        },
        {
          model: Exercise,
          as: 'exercise',
          attributes: [],
          include: [{
            model: WorkoutCategory,
            as: 'category',
            attributes: ['name']
          }]
        }
      ],
      group: ['exercise->category.id', 'exercise->category.name'],
      order: [[sequelize.fn('COUNT', sequelize.col('WorkoutLog.id')), 'DESC']],
      limit: 1,
      raw: true
    });

    res.json({
      summary: {
        totalCompletedWorkouts: totalWorkouts,
        totalDurationMinutes: durationResult || 0,
        workoutsThisWeek,
        workoutsThisMonth,
        totalExercisesLogged,
        favoriteCategory: categoryStats[0]?.['exercise.category.name'] || null
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/progress - User's progress over time
app.get('/api/reports/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period } = req.query; // 'week', 'month', 'year'

    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // Default: month
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get completed workouts in period
    const workouts = await ScheduledWorkout.findAll({
      where: {
        user_id: userId,
        status: 'completed',
        completed_at: { [Op.gte]: startDate }
      },
      include: [{
        model: WorkoutLog,
        as: 'logs',
        include: [{ model: Exercise, as: 'exercise' }]
      }],
      order: [['completed_at', 'ASC']]
    });

    // Calculate progress metrics
    const progressData = workouts.map(workout => {
      const totalVolume = workout.logs.reduce((sum, log) => {
        return sum + (parseFloat(log.weight_kg || 0) * (log.reps_achieved || 0));
      }, 0);

      return {
        date: workout.completed_at,
        title: workout.title,
        duration: workout.duration_minutes,
        exerciseCount: workout.logs.length,
        totalVolume
      };
    });

    // Personal records in period
    const recentPRs = await PersonalRecord.findAll({
      where: {
        user_id: userId,
        recorded_at: { [Op.gte]: startDate }
      },
      include: [{ model: Exercise, as: 'exercise' }],
      order: [['recorded_at', 'DESC']]
    });

    res.json({
      period: period || 'month',
      workoutCount: workouts.length,
      progressData,
      personalRecords: recentPRs
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/personal-records - User's personal records
app.get('/api/reports/personal-records', authenticateToken, async (req, res) => {
  try {
    const personalRecords = await PersonalRecord.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Exercise,
        as: 'exercise',
        include: [{ model: WorkoutCategory, as: 'category' }]
      }],
      order: [['recorded_at', 'DESC']]
    });

    res.json({ personalRecords });
  } catch (error) {
    console.error('Get personal records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================
// Health Check
// =============================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =============================================
// Start Server
// =============================================
const startServer = async () => {
  await seedData();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, sequelize };
