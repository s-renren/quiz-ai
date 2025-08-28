// server/socketServer.ts
import { Server } from "socket.io";

const io = new Server(3001, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

const rooms = new Map<string, Set<string>>();
const userMap = new Map<string, { roomId: string; username: string }>();

io.on("connection", (socket) => {
  console.log("✅ A user connected", socket.id);

  socket.on("join", ({ roomId, username }) => {
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId)!.add(username);

    userMap.set(socket.id, { roomId, username });
    socket.join(roomId);

    io.to(roomId).emit("userList", Array.from(rooms.get(roomId)!));
  });

  socket.on("leave", () => {
    const info = userMap.get(socket.id);
    if (info) {
      const { roomId, username } = info;
      rooms.get(roomId)?.delete(username);
      io.to(roomId).emit("userList", Array.from(rooms.get(roomId)!));
      userMap.delete(socket.id);
      socket.leave(roomId);
    }
  });

  socket.on("disconnect", () => {
    const info = userMap.get(socket.id);
    if (info) {
      const { roomId, username } = info;
      rooms.get(roomId)?.delete(username);
      io.to(roomId).emit("userList", Array.from(rooms.get(roomId)!));
      userMap.delete(socket.id);
    }
  });
});

console.log("🚀 Socket.IO server running on http://localhost:3001");
