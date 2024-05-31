import express from 'express';
import {verifyTimeBasedToken} from "../controllers/auth.controller.js";
import {kickUser} from "../controllers/bot.controller.js";

const botRouter = express.Router();

/**
 * @openapi
 * /api/user/kick:
 *   delete:
 *     description: Renvoie un membre du salon
 *     requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 room_id:
 *                   type: string
 *                 user_id:
 *                   type: string
 *               required:
 *                 - token
 *                 - room_id
 *                 - user_id
 *     responses:
 *       200:
 *         description:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
botRouter.delete("/api/user/kick", verifyTimeBasedToken, kickUser)

export default botRouter
