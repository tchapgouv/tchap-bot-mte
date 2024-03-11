import {SequelizeOptions} from "sequelize-typescript/dist/sequelize/sequelize/sequelize-options.js";

interface DbConf {
    USER: string
    PASSWORD: string
    DB: string
    opts: SequelizeOptions
}

const dbConfig: DbConf = {

    USER: "root",
    PASSWORD: "123456",
    DB: "tchap-bot-webhooks",

    opts: {
        host: "localhost",
        storage: '/tchap-bot-workdir/data/database.sqlite',
        dialect: "sqlite",
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        repositoryMode: true
    }
}
export default dbConfig

