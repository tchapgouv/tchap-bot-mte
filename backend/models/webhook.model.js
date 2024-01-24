export default (sequelize, Sequelize) => {
  const Webhook = sequelize.define("webhook", {
    webhook_label: {
      type: Sequelize.STRING
    },
    webhook_id: {
      type: Sequelize.STRING
    },
    room_id: {
      type: Sequelize.STRING
    },
  });

  return Webhook;
};
