export default (sequelize, DataTypes) => {
  const WorkoutCategory = sequelize.define('WorkoutCategory', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    }
  }, {
    tableName: 'workout_categories',
    timestamps: false
  });
  return WorkoutCategory;
};