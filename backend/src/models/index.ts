import dbConfig from "../configs/db.config.js";
import {Sequelize} from "sequelize-typescript";
import {Webhook} from "./webhook.model.js";
import {User} from "./user.model.js";
import {LdapListGroup} from "./ldapListGroup.model.js";
import {MailListGroup} from "./mailListGroup.model.js";


const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, dbConfig.opts);

sequelize.addModels([User, Webhook, LdapListGroup, MailListGroup]);

console.log(sequelize.models);

export default sequelize;
