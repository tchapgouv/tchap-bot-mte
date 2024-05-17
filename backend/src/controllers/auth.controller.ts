import authService from "../services/auth.service.js";
import userService from "../services/user.service.js";
import logger from "../utils/logger.js";
import {Request, RequestHandler, Response} from "express";
import * as crypto from "crypto";
import jwt from "jsonwebtoken";
import {StatusCodes} from "http-status-codes";

function isFromIntranet(req: Request) {

    logger.debug("X-MineqProvenance = ", req.headers['x-mineqprovenance'])
    const isFromIntranet = req.headers['x-mineqprovenance'] === 'intranet'
    logger.debug("isFromIntranet ?", isFromIntranet)

    return isFromIntranet;
}

export const verifyToken: RequestHandler = (req, res, next) => {

    logger.debug(">>>> verifyToken")

    // TODO !
    if (!isFromIntranet(req)) return res.status(StatusCodes.UNAUTHORIZED).json({message: 'This endpoint is only accessible from within the intranet'});
    if (!req.headers.cookie) return res.status(StatusCodes.UNAUTHORIZED).json({message: 'Unauthenticated (Missing Cookie)'});

    // get cookie from header with name token
    let token = req.headers.cookie.split(';').find((c: string) => {
        return c.trim().startsWith('user_token=')
    });

    if (!token) return res.status(StatusCodes.UNAUTHORIZED).json({message: 'Unauthenticated (Missing Token)'});

    token = token.split('=')[1];

    if (!token) return res.status(StatusCodes.UNAUTHORIZED).json({message: 'Unauthenticated (Empty Token)'});

    authService.verifyJwt(token).then(user => {
        logger.debug(user)

        if (!user) return res.status(StatusCodes.UNAUTHORIZED).json({message: 'Unauthenticated (User not found)'});

        next()
    })
}

export const verifyTimeBasedToken: RequestHandler = (req, res, next) => {

    logger.debug(">>>> verifyTimeToken")

    if (!req.body.token) return res.status(StatusCodes.UNAUTHORIZED).json({message: 'Unauthenticated (Missing Token)'});

    const token = req.body.token
    const currentToken = crypto.createHash('sha512').update(new Date().toLocaleDateString() + "-" + process.env.JWT_KEY).digest('hex')

    if (token !== currentToken) return res.status(StatusCodes.UNAUTHORIZED).json({message: 'Unauthenticated (Token Error)'});

    next()
}

export function authenticate(req: Request, res: Response) {

    const {username, password} = req.body;

    userService.findAllUsernames().then((data) => {

        if (!data) {

            res.status(StatusCodes.UNAUTHORIZED)
                .json({
                    message: "No user found !",
                });

        } else {

            const user = data.find((u: any) => {
                return u.username === username
            });

            if (!user) {

                res.status(StatusCodes.UNAUTHORIZED)
                    .json({
                        message: "User '" + username + "' : Has no rights.",
                    });

            } else {


                if (!process.env.JWT_KEY) {

                    logger.alert("No JWT Key provided in .env file, this is a security risk.")
                    res.status(StatusCodes.UNAUTHORIZED).json({
                        message: "Missing JWT Key, please contact the administrator",
                    });

                } else {

                    authService.ldapAuth(username, password).then((user: any) => {

                        const token = jwt.sign(user, process.env.JWT_KEY || '');

                        // set the cookie
                        res.setHeader('Set-Cookie', `user_token=${token}; HttpOnly;`);
                        res.json({user, token});

                    }).catch(err => {
                        logger.error(JSON.stringify(err))
                        res.status(StatusCodes.UNAUTHORIZED).json({
                            message: "User '" + username + "' : " + err.message,
                        });
                    })
                }
            }
        }
    })
}

export function logout(req: Request, res: Response)     {

    res.setHeader('Set-Cookie', `user_token=; HttpOnly;`);
    res.json({success: 'OK'});
}
