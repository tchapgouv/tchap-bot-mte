import express from 'express';
import {verifyTimeBasedToken} from "../controllers/auth.controller.js";
import {migrateRoom} from "../controllers/bot.controller.js";

const botRouter = express.Router();

botRouter.post("/api/migrate/room", verifyTimeBasedToken, migrateRoom)

export default botRouter
