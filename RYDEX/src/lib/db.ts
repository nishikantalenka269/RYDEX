import mongoose, { type Connection } from "mongoose"

const mongodbUrl = process.env.MONGODB_URI

if (!mongodbUrl) {
throw new Error("db url not found!")
}

interface MongooseCache {
conn: Connection | null
promise: Promise<Connection> | null
}

declare global {
var mongooseConn: MongooseCache | undefined
}

let cached = global.mongooseConn

if (!cached) {
cached = global.mongooseConn = {
conn: null,
promise: null
}
}

const connectDb = async () => {
if (cached.conn) {
return cached.conn
}
if (!cached.promise) {
    cached.promise = mongoose.connect(mongodbUrl).then(c => c.connection)
}

try {
    const conn = await cached.promise
    cached.conn = conn
    return conn
} catch (error) {
    cached.promise = null
    console.log(error)
    throw error
}
}

export default connectDb
