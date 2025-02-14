import express from 'express';
import {verifyOrigin, verifyAuth} from "../controllers/auth.controller.js";
import {getUserFromToken} from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.get("/api/user", verifyOrigin, verifyAuth, getUserFromToken);

export default userRouter
