import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export const getSocket = () => {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        })
    }
    return socket
}
