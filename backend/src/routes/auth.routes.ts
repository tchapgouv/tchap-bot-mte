import express from 'express';
import jwt from "jsonwebtoken";
import {getAllUsers, ldapAuth} from "../services/auth.service.js";
import logger from "../utils/logger.js";

const authRouter = express.Router();

authRouter.post('/api/auth', (req, res) => {

    const {username, password} = req.body;

    getAllUsers().then((data) => {

        if (!data) {

            res.status(401)
                .json({
                    message: "No user found !",
                });

        } else {

            const user = data.find((u: any) => {
                return u.username === username
            });

            if (!user) {

                res.status(401)
                    .json({
                        message: "User '" + username + "' : Has no rights.",
                    });

            } else {


                if (!process.env.JWT_KEY) {

                    logger.alert("No JWT Key provided in .env file, this is a security risk.")
                    res.status(401).json({
                        message: "Missing JWT Key, please contact the administrator",
                    });

                } else {

                    ldapAuth(username, password).then((user: any) => {

                        const token = jwt.sign(user, process.env.JWT_KEY || '');

                        // set the cookie
                        res.setHeader('Set-Cookie', `user_token=${token}; HttpOnly;`);
                        res.json({user, token});

                    }).catch(err => {
                        logger.error(JSON.stringify(err))
                        res.status(401).json({
                            message: "User '" + username + "' : " + err.message,
                        });
                    })
                }
            }
        }
    })
});


authRouter.post('/api/logout', (req, res) => {

    res.setHeader('Set-Cookie', `user_token=; HttpOnly;`);
    res.json({success: 'OK'});
});

export default authRouter
