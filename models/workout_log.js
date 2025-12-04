export default (sequelize, DataTypes) => {
  const WorkoutLog = sequelize.define('WorkoutLog', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    scheduled_workout_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'scheduled_workouts',
        key: 'id'
      }
    },
    exercise_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exercises',
        key: 'id'
      }
    },
    set_number: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    reps_achieved: {
      type: DataTypes.SMALLINT
    },
    weight_kg: {
      type: DataTypes.DECIMAL(6, 2)
    },
    rpe: {
      type: DataTypes.DECIMAL(3, 1),
      validate: {
        min: 1,
        max: 10
      }
    },
    notes: {
      type: DataTypes.TEXT
    },
    completed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
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
    tableName: 'workout_logs',
    timestamps: false
  });
  return WorkoutLog;
};