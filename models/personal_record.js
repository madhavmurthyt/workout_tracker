export default (sequelize, DataTypes) => {
  const PersonalRecord = sequelize.define('PersonalRecord', {
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
    exercise_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exercises',
        key: 'id'
      }
    },
    max_weight_kg: {
      type: DataTypes.DECIMAL(6, 2)
    },
    max_reps: {
      type: DataTypes.SMALLINT
    },
    recorded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    source_log_id: {
      type: DataTypes.UUID,
      references: {
        model: 'workout_logs',
        key: 'id'
      }
    }
  }, {  
    tableName: 'personal_records',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'exercise_id']
      }
    ]
  });
  return PersonalRecord;
}