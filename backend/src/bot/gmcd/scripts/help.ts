import {MatrixClient, MatrixEvent} from "matrix-js-sdk";

export function helpIfAsked(client: MatrixClient, event: MatrixEvent, body: string) {

    const regex: RegExp = /.*(help|aide).*/i

    if (regex.test(body)) {

        if (event?.sender?.name &&
            event?.sender?.userId &&
            event?.event?.room_id) {

            // const roomId = event.event.room_id
            // const userId = event.sender.userId

            // TODO

            return true
        }
    }

    return false
}
