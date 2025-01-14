import express, {Request, Response} from 'express';

const userRouter = express.Router();

userRouter.get("/api/tests/admins", (req: Request, res: Response) => {
    return res.type('text/plain').send(
        "thomas.bouchardon@developpement-durable.gouv.fr\n" +
        "cyril.aeck@developpement-durable.gouv.fr");
});

export default userRouter
