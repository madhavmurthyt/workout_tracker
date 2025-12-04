export default (sequelize, DataTypes) => {
  const ScheduledWorkout = sequelize.define('ScheduledWorkout', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    workout_plan_id: {
      type: DataTypes.UUID,
      references: {
        model: 'workout_plans',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    duration_minutes: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'skipped'),
      allowNull: false,
      defaultValue: 'planned'
    },
    completed_at: {
      type: DataTypes.DATE
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'scheduled_workouts',
    timestamps: false
  });
  return ScheduledWorkout;
};