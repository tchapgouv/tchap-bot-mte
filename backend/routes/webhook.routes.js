import express from 'express';
import {verifyToken} from "../auth.js";
import {create, findAll} from "../controllers/webhook.controller.js";

const router = express.Router();

// Create a new Tutorial
router.post("/create", verifyToken, create);
// router.post("/create", create);

// Retrieve all webhooks
router.get("/getall", verifyToken, findAll);

export default router
