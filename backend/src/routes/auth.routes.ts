import express from 'express';
import {authenticate, logout} from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post('/api/auth', authenticate);

authRouter.post('/api/logout', logout);

export default authRouter
