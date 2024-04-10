import {ErrorRequestHandler} from "express-serve-static-core";
import logger from "../utils/logger.js";
import {StatusCodes} from "http-status-codes";

export const syntaxErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
    if (error instanceof SyntaxError) {
        logger.notice("Someone sent malformed body : ", error)
        res.status(StatusCodes.BAD_REQUEST).send({
            message: error
        })
    } else {
        next();
    }
}
