import express from 'express';
import {verifyToken} from "../controllers/auth.controller.js";
import {getUserFromToken} from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.get("/api/user", verifyToken, getUserFromToken);

export default userRouter
