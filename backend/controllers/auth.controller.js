import {verifyJwt} from "../services/auth.service.js";
import logger from "../utils/logger.js";

export async function verifyToken (req, res, next) {

  logger.debug(">>>> verifyToken")

  if (!req.headers.cookie) return res.status(401).json({message: 'Unauthenticated (Missing Cookie)'});

  // get cookie from header with name token
  let token = req.headers.cookie.split(';').find(c => {
    return c.trim().startsWith('user_token=')
  });

  if (!token) return res.status(401).json({message: 'Unauthenticated (Missing Token)'});

  token = token.split('=')[1];

  if (!token) return res.status(401).json({message: 'Unauthenticated (Empty Token)'});

  verifyJwt(token).then(user => {
    logger.debug(user)

    if (!user) return res.status(401).json({message: 'Unauthenticated (User not found)'});

    next()
  })
}
