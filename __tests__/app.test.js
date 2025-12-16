import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app, sequelize } from '../app.js';
import {
  User,
  Exercise,
  WorkoutCategory
} from '../models/index.js';

// Test data
let testUser;
let testExercise;

// Helper to get a fresh token via login
const getAuthToken = async (email = 'test@example.com', password = 'testpassword123') => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.token;
};

beforeAll(async () => {
  // Sync database
  await sequelize.sync({ force: true });

  // Seed workout category
  await WorkoutCategory.create({
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Muscle Group'
  });

  // Create test user
  const passwordHash = await bcrypt.hash('testpassword123', 10);
  testUser = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    passwordHash,
    fullname: 'Test User'
  });

  // Create test exercise
  testExercise = await Exercise.create({
    name: 'Test Exercise',
    description: 'A test exercise',
    category_id: '00000000-0000-0000-0000-000000000001',
    created_by: testUser.id,
    isPublic: true
  });
});

afterAll(async () => {
  await sequelize.close();
});

// =============================================
// AUTH TESTS
// =============================================
describe('Auth Endpoints', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          fullname: 'New User'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe('newuser');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'incomplete' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Username, email, and password are required');
    });

    it('should return 409 if user already exists', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'testuser',
          email: 'another@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should return 401 with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
    });

    it('should return 400 if email or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // Create a separate user for logout testing to avoid affecting other tests
      const passwordHash = await bcrypt.hash('logoutpass', 10);
      await User.create({
        username: 'logoutuser',
        email: 'logout@example.com',
        passwordHash,
        fullname: 'Logout User'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'logout@example.com', password: 'logoutpass' });

      const logoutToken = loginRes.body.token;

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${logoutToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');

      // Try to use the same token - should fail
      const protectedRes = await request(app)
        .get('/api/exercises')
        .set('Authorization', `Bearer ${logoutToken}`);

      expect(protectedRes.statusCode).toBe(401);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.statusCode).toBe(401);
    });
  });
});

// =============================================
// EXERCISES TESTS
// =============================================
describe('Exercises Endpoints', () => {
  it('should list all public exercises', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/exercises')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('exercises');
    expect(Array.isArray(res.body.exercises)).toBe(true);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/exercises');
    expect(res.statusCode).toBe(401);
  });
});

// =============================================
// WORKOUT PLAN TESTS
// =============================================
describe('Workout Plan Endpoints', () => {
  it('should create a workout plan', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My First Workout',
        description: 'A test workout plan',
        exercises: [
          {
            exercise_id: testExercise.id,
            sets: 4,
            reps: 10,
            weight_kg: 50
          }
        ]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.workout.name).toBe('My First Workout');
    expect(res.body.workout.planExercises).toHaveLength(1);
  });

  it('should return 400 if name is missing', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'No name' });

    expect(res.statusCode).toBe(400);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/workouts')
      .send({ name: 'Unauthorized Workout' });

    expect(res.statusCode).toBe(401);
  });

  it('should list user workouts', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('workouts');
    expect(Array.isArray(res.body.workouts)).toBe(true);
  });

  it('should get workout details', async () => {
    const token = await getAuthToken();
    
    // First create a workout
    const createRes = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Workout to Get' });

    const workoutId = createRes.body.workout.id;

    const res = await request(app)
      .get(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.workout.id).toBe(workoutId);
  });

  it('should return 404 for non-existent workout', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/workouts/00000000-0000-0000-0000-000000000999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  it('should update a workout plan', async () => {
    const token = await getAuthToken();
    
    // First create a workout
    const createRes = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Workout to Update' });

    const workoutId = createRes.body.workout.id;

    const res = await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Workout Name',
        description: 'Updated description',
        isFavorite: true
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.workout.name).toBe('Updated Workout Name');
    expect(res.body.workout.isFavorite).toBe(true);
  });

  it('should return 404 when updating non-existent workout', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .put('/api/workouts/00000000-0000-0000-0000-000000000999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Not Found' });

    expect(res.statusCode).toBe(404);
  });

  it('should delete a workout plan', async () => {
    const token = await getAuthToken();
    
    // Create a workout to delete
    const createRes = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Delete' });

    const workoutId = createRes.body.workout.id;

    const res = await request(app)
      .delete(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Workout deleted successfully');
  });

  it('should return 404 when deleting non-existent workout', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .delete('/api/workouts/00000000-0000-0000-0000-000000000999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});

// =============================================
// SCHEDULED WORKOUT TESTS
// =============================================
describe('Schedule Endpoints', () => {
  it('should schedule a workout', async () => {
    const token = await getAuthToken();
    
    // Create a workout plan first
    const workoutRes = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Workout for Schedule Test' });

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1);

    const res = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${token}`)
      .send({
        workout_plan_id: workoutRes.body.workout.id,
        title: 'Morning Workout',
        notes: 'Remember to warm up',
        scheduled_at: scheduledDate.toISOString(),
        duration_minutes: 60
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.scheduledWorkout.title).toBe('Morning Workout');
    expect(res.body.scheduledWorkout.status).toBe('planned');
  });

  it('should return 400 if title or scheduled_at is missing', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'Missing required fields' });

    expect(res.statusCode).toBe(400);
  });

  it('should list scheduled workouts', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/schedule')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('scheduledWorkouts');
    expect(Array.isArray(res.body.scheduledWorkouts)).toBe(true);
  });

  it('should filter by status', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/schedule?status=planned')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    res.body.scheduledWorkouts.forEach(sw => {
      expect(sw.status).toBe('planned');
    });
  });

  it('should get scheduled workout details', async () => {
    const token = await getAuthToken();
    
    // Create a scheduled workout
    const createRes = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Workout to Get',
        scheduled_at: new Date().toISOString()
      });

    const scheduleId = createRes.body.scheduledWorkout.id;

    const res = await request(app)
      .get(`/api/schedule/${scheduleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.scheduledWorkout.id).toBe(scheduleId);
  });

  it('should update a scheduled workout', async () => {
    const token = await getAuthToken();
    
    // Create a scheduled workout
    const createRes = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Workout to Update',
        scheduled_at: new Date().toISOString()
      });

    const scheduleId = createRes.body.scheduledWorkout.id;

    const res = await request(app)
      .put(`/api/schedule/${scheduleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'in_progress',
        notes: 'Started the workout'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.scheduledWorkout.status).toBe('in_progress');
  });

  it('should set completed_at when status is completed', async () => {
    const token = await getAuthToken();
    
    // Create a scheduled workout
    const createRes = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Workout to Complete',
        scheduled_at: new Date().toISOString()
      });

    const scheduleId = createRes.body.scheduledWorkout.id;

    const res = await request(app)
      .put(`/api/schedule/${scheduleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' });

    expect(res.statusCode).toBe(200);
    expect(res.body.scheduledWorkout.status).toBe('completed');
    expect(res.body.scheduledWorkout.completed_at).toBeTruthy();
  });

  it('should delete a scheduled workout', async () => {
    const token = await getAuthToken();
    
    // Create a workout to delete
    const createRes = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'To Delete',
        scheduled_at: new Date().toISOString()
      });

    const scheduleId = createRes.body.scheduledWorkout.id;

    const res = await request(app)
      .delete(`/api/schedule/${scheduleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Scheduled workout deleted successfully');
  });
});

// =============================================
// WORKOUT LOG TESTS
// =============================================
describe('Workout Log Endpoints', () => {
  it('should log exercise completion', async () => {
    const token = await getAuthToken();
    
    // Create a scheduled workout for logging
    const scheduleRes = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Log Test Workout',
        scheduled_at: new Date().toISOString()
      });

    const res = await request(app)
      .post('/api/logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scheduled_workout_id: scheduleRes.body.scheduledWorkout.id,
        exercise_id: testExercise.id,
        set_number: 1,
        reps_achieved: 10,
        weight_kg: 50,
        rpe: 7
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.log.reps_achieved).toBe(10);
  });

  it('should update personal record if weight is higher', async () => {
    const token = await getAuthToken();
    
    // Create a scheduled workout
    const scheduleRes = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'PR Test Workout',
        scheduled_at: new Date().toISOString()
      });

    // Log with high weight
    await request(app)
      .post('/api/logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scheduled_workout_id: scheduleRes.body.scheduledWorkout.id,
        exercise_id: testExercise.id,
        set_number: 1,
        reps_achieved: 8,
        weight_kg: 150
      });

    const prRes = await request(app)
      .get('/api/reports/personal-records')
      .set('Authorization', `Bearer ${token}`);

    const exercisePR = prRes.body.personalRecords.find(
      pr => pr.exercise_id === testExercise.id
    );
    expect(parseFloat(exercisePR.max_weight_kg)).toBeGreaterThanOrEqual(150);
  });

  it('should return 400 if required fields are missing', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ reps_achieved: 10 });

    expect(res.statusCode).toBe(400);
  });

  it('should get logs for a scheduled workout', async () => {
    const token = await getAuthToken();
    
    // Create a scheduled workout
    const scheduleRes = await request(app)
      .post('/api/schedule')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Get Logs Test',
        scheduled_at: new Date().toISOString()
      });

    const scheduleId = scheduleRes.body.scheduledWorkout.id;

    // Log an exercise
    await request(app)
      .post('/api/logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scheduled_workout_id: scheduleId,
        exercise_id: testExercise.id,
        set_number: 1,
        reps_achieved: 10,
        weight_kg: 40
      });

    const res = await request(app)
      .get(`/api/logs/scheduled/${scheduleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('logs');
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  it('should return 404 for non-existent scheduled workout', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/logs/scheduled/00000000-0000-0000-0000-000000000999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});

// =============================================
// REPORTS TESTS
// =============================================
describe('Reports Endpoints', () => {
  it('should return workout summary', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('summary');
    expect(res.body.summary).toHaveProperty('totalCompletedWorkouts');
    expect(res.body.summary).toHaveProperty('totalDurationMinutes');
    expect(res.body.summary).toHaveProperty('workoutsThisWeek');
    expect(res.body.summary).toHaveProperty('workoutsThisMonth');
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/reports/summary');
    expect(res.statusCode).toBe(401);
  });

  it('should return progress data', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/reports/progress')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('period');
    expect(res.body).toHaveProperty('workoutCount');
    expect(res.body).toHaveProperty('progressData');
    expect(res.body).toHaveProperty('personalRecords');
  });

  it('should accept period parameter', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/reports/progress?period=week')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.period).toBe('week');
  });

  it('should return personal records', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/reports/personal-records')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('personalRecords');
    expect(Array.isArray(res.body.personalRecords)).toBe(true);
  });
});

// =============================================
// HEALTH CHECK TEST
// =============================================
describe('Health Check', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});

// =============================================
// AUTHORIZATION TESTS
// =============================================
describe('Authorization', () => {
  it('should not allow access to another user\'s workout', async () => {
    // Create another user
    const passwordHash = await bcrypt.hash('otherpassword', 10);
    await User.create({
      username: 'otheruser2',
      email: 'other2@example.com',
      passwordHash,
      fullname: 'Other User 2'
    });

    // Login as other user and create a workout
    const otherLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'other2@example.com', password: 'otherpassword' });
    const otherToken = otherLoginRes.body.token;

    const workoutRes = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Other User Workout' });

    const otherWorkoutId = workoutRes.body.workout.id;

    // Try to access with main user token
    const mainToken = await getAuthToken();
    const res = await request(app)
      .get(`/api/workouts/${otherWorkoutId}`)
      .set('Authorization', `Bearer ${mainToken}`);

    expect(res.statusCode).toBe(404);
  });

  it('should not allow updating another user\'s workout', async () => {
    // Create another user
    const passwordHash = await bcrypt.hash('otherpassword3', 10);
    await User.create({
      username: 'otheruser3',
      email: 'other3@example.com',
      passwordHash,
      fullname: 'Other User 3'
    });

    // Login as other user and create a workout
    const otherLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'other3@example.com', password: 'otherpassword3' });
    const otherToken = otherLoginRes.body.token;

    const workoutRes = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Other User Workout 3' });

    const otherWorkoutId = workoutRes.body.workout.id;

    // Try to update with main user token
    const mainToken = await getAuthToken();
    const res = await request(app)
      .put(`/api/workouts/${otherWorkoutId}`)
      .set('Authorization', `Bearer ${mainToken}`)
      .send({ name: 'Hacked Name' });

    expect(res.statusCode).toBe(404);
  });

  it('should not allow deleting another user\'s workout', async () => {
    // Create another user
    const passwordHash = await bcrypt.hash('otherpassword4', 10);
    await User.create({
      username: 'otheruser4',
      email: 'other4@example.com',
      passwordHash,
      fullname: 'Other User 4'
    });

    // Login as other user and create a workout
    const otherLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'other4@example.com', password: 'otherpassword4' });
    const otherToken = otherLoginRes.body.token;

    const workoutRes = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Other User Workout 4' });

    const otherWorkoutId = workoutRes.body.workout.id;

    // Try to delete with main user token
    const mainToken = await getAuthToken();
    const res = await request(app)
      .delete(`/api/workouts/${otherWorkoutId}`)
      .set('Authorization', `Bearer ${mainToken}`);

    expect(res.statusCode).toBe(404);
  });
});
