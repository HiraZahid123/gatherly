import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
    if (typeof window === "undefined") return null;

    if (!socket) {
        // Connect to the same origin, strictly using websockets to prevent long-polling from exhausting Hostinger's Passenger threads
        socket = io({
            transports: ['websocket'],
            upgrade: false
        });
    }
    return socket;
};
