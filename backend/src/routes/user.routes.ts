import express from 'express';
import {verifyToken} from "../controllers/auth.controller.js";
import {getUserFromToken} from "../services/auth.service.js";

const userRouter = express.Router();
userRouter.get("/api/user", verifyToken, (req, res) => {

    // get cookie from header with name token
    let token = req?.headers?.cookie?.split(';').find(c => {
        return c.trim().startsWith('user_token=')
    });
    token = token?.split('=')[1];

    if (!token) res.sendStatus(403).send({
        message: "Missing JWT token."
    });
    else {
        res.json({user: getUserFromToken(token)})
    }
});

export default userRouter
