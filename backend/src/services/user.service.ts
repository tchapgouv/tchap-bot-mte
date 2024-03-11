import sequelize from "../models/index.js";
import {Request, Response} from "express";
import {User} from "../models/user.model.js";

// const Op = db.Sequelize.Op;

const userRepository = sequelize.getRepository(User)

async function create(username: string) {

    await userRepository.findOrCreate({
        where: {
            username: username
        },
        defaults: {
            username: username
        }
    }).then(value => {
        return value
    })
}

// Retrieve all Webhooks from the database.
function findAll(req: Request, res: Response) {

    userRepository.findAll()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving users."
            });
        });
}

export {create, findAll}
