import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
    if (typeof window === "undefined") return null;

    if (!socket) {
        // Connect to the same origin
        socket = io();
    }
    return socket;
};
