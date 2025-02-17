import express from 'express';
import {fetchMetrics} from "../controllers/metrics.controller.js";

const userRouter = express.Router();

userRouter.get("/metrics", fetchMetrics);

export default userRouter
