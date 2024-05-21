import express from 'express';
import {verifyTimeBasedToken} from "../controllers/auth.controller.js";
import {createRoom, deleteRoom, getRoomName, inviteUsers, migrateRoom} from "../controllers/bot.controller.js";

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
 *               required:
 *                 - token
 *                 - room_id
 *                 - users_list
 *     responses:
 *       200:
 *         description:
 */
botRouter.post("/api/migrate/room", verifyTimeBasedToken, migrateRoom)

/**
 * @openapi
 * /api/room/create:
 *   post:
 *     description: Création d'un salon
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
 *               required:
 *                 - token
 *                 - room_name
 *     responses:
 *       200:
 *         description:
 */
botRouter.post("/api/room/create", verifyTimeBasedToken, createRoom)

/**
 * @openapi
 * /api/room/invite:
 *   post:
 *     description: Invitation d'utilisateurs dans un salon
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
 *                 users_list:
 *                   type: array
 *                   items:
 *                     type: string
 *               required:
 *                 - token
 *                 - room_id
 *                 - users_list
 *     responses:
 *       200:
 *         description:
 */
botRouter.post("/api/room/invite", verifyTimeBasedToken, inviteUsers)

/**
 * @openapi
 * /api/room/name:
 *   post:
 *     description: Récupération du nom d'un salon avec son id
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
 *               required:
 *                 - token
 *                 - room_id
 *     responses:
 *       200:
 *         description:
 */
botRouter.post("/api/room/name", verifyTimeBasedToken, getRoomName)

/**
 * @openapi
 * /api/room/delete:
 *   delete:
 *     description: Chose la plus proche d’une suppression dans le contexte Matrix. Kick tous les users non-admin puis quitte le salon. (Matrix Purge automatiquement les salons vides)
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
 *               required:
 *                 - token
 *                 - room_id
 *     responses:
 *       200:
 *         description:
 */
botRouter.delete("/api/room/delete", verifyTimeBasedToken, deleteRoom)

/**
 * @openapi
 * /api/room/member:
 *   post:
 *     description: Vérifie si Bot-Gmcd ou un utilisateur est membre d'un salon
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
 *     responses:
 *       200:
 *         description:
 */
botRouter.post("/api/room/member", verifyTimeBasedToken, getRoomName)

export default botRouter
