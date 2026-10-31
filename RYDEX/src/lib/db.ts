import mongoose from "mongoose"

const mongodbUrl = process.env.MONGODB_URI

if (!mongodbUrl) {
    throw new Error("db url not found!")
}

type MongooseCache = {
    conn: typeof mongoose.connection | null
    promise: Promise<typeof mongoose.connection> | null
}

const globalWithMongoose = globalThis as typeof globalThis & {
    mongooseConn?: MongooseCache
}

let cached = globalWithMongoose.mongooseConn

if (!cached) {
    cached = globalWithMongoose.mongooseConn = {
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
