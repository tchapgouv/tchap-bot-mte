import express from 'express';
import {verifyOrigin, verifyAuth} from "../controllers/auth.controller.js";
import {searchUser, kickUser, searchUserFromMail} from "../controllers/bot.controller.js";

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
botRouter.delete("/api/user/kick", verifyOrigin, verifyAuth, kickUser)

/**
 * @openapi
 * /api/user/search/mail:
 *   post:
 *     description: Renvoie un utilisateur à partir de son mail
 *     requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user_mail:
 *                   type: string
 *               required:
 *                 - token
 *                 - user_mail
 *     responses:
 *       200:
 *         description:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                 display_name?:
 *                   type: string
 *                 avatar_url?:
 *                   type: string
 */
botRouter.post("/api/user/search/mail", verifyOrigin, verifyAuth, searchUserFromMail)

/**
 * @openapi
 * /api/user/search:
 *   post:
 *     description: Renvoie un utilisateur à partir d'un terme
 *     requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 term:
 *                   type: string
 *               required:
 *                 - token
 *                 - term
 *     responses:
 *       200:
 *         description:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                 display_name?:
 *                   type: string
 *                 avatar_url?:
 *                   type: string
 */
botRouter.post("/api/user/search", verifyOrigin, verifyAuth, searchUser)

export default botRouter
