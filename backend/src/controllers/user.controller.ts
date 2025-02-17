import authService from "../services/auth.service.js";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";

export function getUserFromToken(req: Request, res: Response) {

    // get cookie from header with name token
    let token = req?.headers?.cookie?.split(';').find(c => {
        return c.trim().startsWith('user_token=')
    });
    token = token?.split('=')[1];

    if (!token) return res.status(StatusCodes.UNAUTHORIZED).send({
        message: "Missing JWT token."
    });
    else {
        return res.json({user: authService.getUserFromToken(token)})
    }
}
