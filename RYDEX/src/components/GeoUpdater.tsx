"use client";
import { getSocket } from "@/lib/socket";
import React, { useEffect, useRef } from "react";

function GeoUpdater({ userId }: { userId: string }) {
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    socketRef.current = socket;

    const registerIdentity = () => {
      socket.emit("identity", userId);
    };

    // Keep socketId fresh across reconnects so /emit can reach this user.
    registerIdentity();
    socket.on("connect", registerIdentity);

    let watcher: number | null = null;

    if (navigator.geolocation) {
      watcher = navigator.geolocation.watchPosition(
        ({ coords }) => {
          socket.emit("update-location", {
            userId,
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        },
        (err) => {
          console.log(err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
        },
      );
    }

    return () => {
      socket.off("connect", registerIdentity);
      if (watcher !== null) {
        navigator.geolocation.clearWatch(watcher);
      }
    };
  }, [userId]);

  return null;
}

export default GeoUpdater;
