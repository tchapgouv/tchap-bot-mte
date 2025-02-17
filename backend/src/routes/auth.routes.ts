import express from 'express';
import {authenticate, logout, verifyOrigin} from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post('/api/auth', verifyOrigin, authenticate);

authRouter.post('/api/logout', logout);

export default authRouter
