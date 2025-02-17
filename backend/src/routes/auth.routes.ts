import express from 'express';
import {authenticate, logout, verifyOrigin} from "../controllers/auth.controller.js";
import slowDown from "express-slow-down";

const authRouter = express.Router();

const slowdown = slowDown({
    delayAfter: 1,                // slows down the request rate after 1 request
    delayMs: () => 500 , // adding a delay of 500 milliseconds (0.5 seconds)
    windowMs: 15 * 60 * 1000,     // within a 15-minute window
})

authRouter.post('/api/auth', verifyOrigin, slowdown, authenticate);

authRouter.post('/api/logout', logout);

export default authRouter
