import {DataTypes} from 'sequelize'

export default (sequelize) => {
  return sequelize.define("user", {
    username: {
      type: DataTypes.STRING
    }
  });
};
