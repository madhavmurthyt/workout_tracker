# Workout Tracker API - Postman Collection

This folder contains Postman collection and environment files for testing the Workout Tracker API.

## Files

| File | Description |
|------|-------------|
| `Workout_Tracker_API.postman_collection.json` | Complete API collection with all endpoints |
| `Workout_Tracker_Local.postman_environment.json` | Environment variables for local development |

## Quick Start

### 1. Import into Postman

1. Open Postman
2. Click **Import** button
3. Drag and drop both JSON files, or select them from file browser
4. The collection and environment will appear in your workspace

### 2. Select Environment

1. In the top-right corner, click the environment dropdown
2. Select **"Workout Tracker - Local"**

### 3. Start the Server

```bash
cd workout_tracker
npm start
```

### 4. Run Your First Request

1. Open the **Authentication** folder
2. Click **"2. Login"** (uses the demo user created by seed data)
3. Click **Send**
4. The auth token is automatically saved for subsequent requests

## Collection Structure

```
📁 Health Check
   └── Health Check (GET /health)

📁 Authentication
   ├── 1. Signup (POST /api/auth/signup)
   ├── 2. Login (POST /api/auth/login)
   ├── 3. Login Invalid (POST /api/auth/login)
   └── 4. Logout (POST /api/auth/logout)

📁 Exercises
   ├── List All Exercises (GET /api/exercises)
   └── List by Category (GET /api/exercises?category=...)

📁 Workout Plans
   ├── 1. Create Workout (POST /api/workouts)
   ├── 2. List My Workouts (GET /api/workouts)
   ├── 3. List Favorites (GET /api/workouts?status=favorite)
   ├── 4. Get Details (GET /api/workouts/:id)
   ├── 5. Update Workout (PUT /api/workouts/:id)
   └── 6. Delete Workout (DELETE /api/workouts/:id)

📁 Scheduled Workouts
   ├── 1. Schedule Workout (POST /api/schedule)
   ├── 2. List Scheduled (GET /api/schedule)
   ├── 3. List by Status (GET /api/schedule?status=...)
   ├── 4. Get Details (GET /api/schedule/:id)
   ├── 5. Start Workout (PUT /api/schedule/:id)
   ├── 6. Complete Workout (PUT /api/schedule/:id)
   └── 7. Delete Scheduled (DELETE /api/schedule/:id)

📁 Workout Logs
   ├── 1. Log Exercise Set (POST /api/logs)
   ├── 2. Log Another Set (POST /api/logs)
   └── 3. Get Logs for Workout (GET /api/logs/scheduled/:id)

📁 Reports
   ├── Workout Summary (GET /api/reports/summary)
   ├── Progress - Month (GET /api/reports/progress?period=month)
   ├── Progress - Week (GET /api/reports/progress?period=week)
   ├── Progress - Year (GET /api/reports/progress?period=year)
   └── Personal Records (GET /api/reports/personal-records)
```

## Variables

The collection uses these variables (automatically managed):

| Variable | Description |
|----------|-------------|
| `baseUrl` | API base URL (default: http://localhost:3000) |
| `authToken` | JWT token (set after login/signup) |
| `userId` | Current user's ID |
| `workoutId` | Last created/accessed workout ID |
| `exerciseId` | First exercise ID from exercises list |
| `scheduleId` | Last created/accessed scheduled workout ID |
| `logId` | Last created workout log ID |

## Test Scripts

Each request includes test scripts that:
- Verify response status codes
- Validate response structure
- Automatically save IDs for use in subsequent requests

## Recommended Test Flow

For a complete end-to-end test, run requests in this order:

1. **Health Check** - Verify server is running
2. **Login** - Get auth token (uses demo@example.com / demo123)
3. **List All Exercises** - Get available exercises and save an exercise ID
4. **Create Workout Plan** - Create a workout with exercises
5. **Schedule Workout** - Schedule the workout for tomorrow
6. **Start Workout** - Update status to in_progress
7. **Log Exercise Set** - Log completed sets
8. **Complete Workout** - Mark workout as done
9. **View Reports** - Check summary and progress

## Demo User Credentials

The seed data creates a demo user:
- **Email:** demo@example.com
- **Password:** demo123

## Running Collection Tests

To run all tests in the collection:

1. Click the **"..."** menu on the collection
2. Select **"Run collection"**
3. Choose requests to run or run all
4. Click **"Run Workout Tracker API"**

## Tips

- Run "Login" first before any authenticated requests
- The collection auto-saves IDs, so you can run requests in sequence
- If you get 401 errors, your token may have expired - run Login again
- Pre-request scripts dynamically set values like scheduled dates

