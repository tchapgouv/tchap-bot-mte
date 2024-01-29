import dbConfig from "../configs/db.config.js";
import Sequelize from "sequelize";
import webhook from "./webhook.model.js"
import user from "./user.model.js"


const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  storage: dbConfig.storage,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.webhook = webhook(sequelize, Sequelize);
db.user = user(sequelize, Sequelize);

export default db;
