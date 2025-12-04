// id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//     workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
//     exercise_id     UUID NOT NULL REFERENCES exercises(id),
//     sort_order      INT NOT NULL DEFAULT 0,
//     sets            SMALLINT NOT NULL DEFAULT 3,
//     reps            SMALLINT,
//     weight_kg       NUMERIC(6,2),
//     rest_seconds    INT DEFAULT 90,
//     notes           TEXT,
//     UNIQUE(workout_plan_id, sort_order)

export default (sequelize, DataTypes) => {
  const WorkoutPlanExercise = sequelize.define('WorkoutPlanExercise', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    workout_plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'workout_plans',
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
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    sets: {
      type: DataTypes.SMALLINT,
      defaultValue: 3
    },
    reps: {
      type: DataTypes.SMALLINT
    },
    weight_kg: {
      type: DataTypes.DECIMAL(5, 2)
    },
    rest_seconds: {
      type: DataTypes.INTEGER,
      defaultValue: 60
    },
    notes: {
      type: DataTypes.TEXT
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
    tableName: 'workout_plan_exercises',
    timestamps: false
  });
  return WorkoutPlanExercise;
};