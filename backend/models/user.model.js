export default (sequelize, Sequelize) => {
  const Webhook = sequelize.define("user", {
    username: {
      type: Sequelize.STRING
    }
  });

  return Webhook;
};
