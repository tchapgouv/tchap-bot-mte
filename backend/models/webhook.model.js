import {DataTypes} from "sequelize";

export default (sequelize) => {
  return sequelize.define("webhook", {
    webhook_label: {
      type: DataTypes.STRING
    },
    webhook_id: {
      type: DataTypes.STRING
    },
    room_id: {
      type: DataTypes.STRING
    },
    script: {
      type: DataTypes.STRING
    },
  });
};
