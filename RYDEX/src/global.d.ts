import { Connection } from "mongoose";

declare global {
    var mongooseConnection: {
        conn: Connection | null,
        promise: Promise<Connection> | null
    }
}

export { }
