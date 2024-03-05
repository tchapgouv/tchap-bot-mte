import {verifyJwt} from "../services/auth.service.js";
import logger from "../utils/logger.js";
import {RequestHandler} from "express";
import * as crypto from "crypto";

export const verifyToken: RequestHandler = (req, res, next) => {

    logger.debug(">>>> verifyToken")

    if (!req.headers.cookie) return res.status(401).json({message: 'Unauthenticated (Missing Cookie)'});

    // get cookie from header with name token
    let token = req.headers.cookie.split(';').find((c: string) => {
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

export const verifyTimeToken: RequestHandler = (req, res, next) => {

    logger.debug(">>>> verifyTimeToken")

    if (!req.body.token) return res.status(401).json({message: 'Unauthenticated (Missing Token)'});

    const token = req.body.token
    const currentToken = crypto.createHash('sha512').update(new Date().toLocaleDateString() + "-" + process.env.JWT_KEY).digest('hex')

    if (token !== currentToken) return res.status(401).json({message: 'Unauthenticated (Token Error)'});

    next()
}
