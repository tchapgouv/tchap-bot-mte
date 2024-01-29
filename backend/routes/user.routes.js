import express from 'express';
import {verifyToken} from "../controllers/auth.controller.js";
import {getUserFromToken} from "../services/auth.service.js";

const router = express.Router();
router.get("/api/user", verifyToken, (req, res) => {

  // get cookie from header with name token
  let token = req.headers.cookie.split(';').find(c => {
    return c.trim().startsWith('user_token=')
  });
  token = token.split('=')[1];

  res.json({user: getUserFromToken(token)})
});

export default router
