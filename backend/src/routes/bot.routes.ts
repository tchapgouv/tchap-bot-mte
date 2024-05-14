import express from 'express';
import {verifyTimeBasedToken} from "../controllers/auth.controller.js";
import {migrateRoom} from "../controllers/bot.controller.js";

const botRouter = express.Router();

/**
 * @openapi
 * /api/migrate/room:
 *   post:
 *     description: Création d'un salon et invitation d'utilisateurs
 *     requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 room_name:
 *                   type: string
 *                 users_list:
 *                   type: array
 *                   items:
 *                     type: string
 *     responses:
 *       200:
 *         description:
 */
botRouter.post("/api/migrate/room", verifyTimeBasedToken, migrateRoom)

export default botRouter
