import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import User from "./models/user.model.js";

dotenv.config();

const port = process.env.PORT || 5000;
const mongodbUrl = process.env.MONGODB_URL;

const connectDb = async () => {
  try {
    await mongoose.connect(mongodbUrl);
    console.log("db connected");
  } catch (error) {
    console.log("db error:", error.message);
  }
};

const app = express();
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_BASE_URL,
    methods: ["GET", "POST"],
  },
});

// Send an event to a specific connected user.
app.post("/emit", async (req, res) => {
  const { event, userId, data } = req.body;

  try {
    if (!event || !userId) {
      return res.status(400).json({
        success: false,
        message: "event and userId are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.socketId) {
      return res.status(400).json({
        success: false,
        message: "User is not connected",
      });
    }

    io.to(user.socketId).emit(event, data);

    console.log("Event emitted:", {
      event,
      userId,
      socketId: user.socketId,
    });

    return res.json({
      success: true,
      message: "Event emitted successfully",
    });
  } catch (error) {
    console.error("Emit error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to emit event",
    });
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("identity", async (userId) => {
    try {
      if (!userId) {
        console.log("Identity failed: Missing userId");
        return;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          socketId: socket.id,
          isOnline: true,
        },
        { new: true }
      );

      if (!user) {
        console.log("Identity failed: User not found", userId);
        return;
      }

      socket.userId = userId;

      console.log("Identity registered:", {
        userId,
        role: user.role,
        socketId: socket.id,
      });
    } catch (error) {
      console.error("Identity error:", error.message);
    }
  });

  socket.on(
    "update-location",
    async ({ userId, latitude, longitude } = {}) => {
      try {
        if (
          !userId ||
          typeof latitude !== "number" ||
          typeof longitude !== "number"
        ) {
          return;
        }

        await User.findByIdAndUpdate(userId, {
          location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        });
      } catch (error) {
        console.error("Location update error:", error.message);
      }
    }
  );

  socket.on("join-ride", (bookingId) => {
    if (!bookingId) return;

    socket.join(`ride-${bookingId}`);

    console.log("Joined ride:", {
      bookingId,
      socketId: socket.id,
    });
  });

  socket.on(
    "driver-location-update",
    ({ bookingId, latitude, longitude, status } = {}) => {
      if (!bookingId) return;

      io.to(`ride-${bookingId}`).emit("driver-location", {
        latitude,
        longitude,
        status,
      });
    }
  );

  socket.on("chat-message", (data) => {
    if (!data?.bookingId) return;

    io.to(`ride-${data.bookingId}`).emit("chat-message", data);
  });

  socket.on("disconnect", async () => {
    console.log("Socket disconnected:", socket.id);

    try {
      if (!socket.userId) return;

      // Avoid clearing a newer connection for the same user.
      await User.findOneAndUpdate(
        {
          _id: socket.userId,
          socketId: socket.id,
        },
        {
          socketId: null,
          isOnline: false,
        }
      );
    } catch (error) {
      console.error("Disconnect error:", error.message);
    }
  });
});

server.listen(port, async () => {
  console.log(`Socket server started on port ${port}`);
  await connectDb();
});
