export default (sequelize, DataTypes) => {
  const Exercise = sequelize.define('Exercise', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'workout_categories',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    default_sets: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 3
    },
    default_reps: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 10
    },
    default_weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    default_rest_seconds: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 60
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    tableName: 'exercises',
    timestamps: false
  });
  return Exercise;
};