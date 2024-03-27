import {Request, Response} from "express";
import {create as createWebhook} from "../services/webhook.service.js"

export function create(req: Request, res: Response) {
    if (!req.body.room) {
        res.sendStatus(400).send({
            message: "Room id can not be empty!"
        });
        return;
    }

    createWebhook(req.body.label,
        req.body.room
    )
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.sendStatus(500).send({
                message:
                    err.message || "Some error occurred while creating webhook."
            });
        });

}
