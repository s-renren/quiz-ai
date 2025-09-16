import { Server } from "socket.io";

const io = new Server(3001, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

type RoomStatus = "lobby" | "playing" | "finished";

type Room = {
  players: Set<string>;
  status: RoomStatus;
};

const rooms = new Map<string, Room>();
const userMap = new Map<string, { roomId: string; username: string }>();

io.on("connection", (socket) => {
  console.log("✅ A user connected", socket.id);

  socket.on("join", ({ roomId, username }) => {
    let room = rooms.get(roomId);
    if (!room) {
      room = { players: new Set(), status: "lobby" };
      rooms.set(roomId, room);
    }

    if (room.status !== "lobby") {
      socket.emit("joinRejected", { reason: "ゲームは既に開始されています。" });
      return;
    }

    room.players.add(username);
    userMap.set(socket.id, { roomId, username });
    socket.join(roomId);

    io.to(roomId).emit("userList", Array.from(room.players));
  });

  // ユーザーが自分の意志で退出した場合の処理
  socket.on("leave", () => {
    const info = userMap.get(socket.id);
    if (info) {
      const { roomId, username } = info;
      rooms.get(roomId)?.players.delete(username);
      io.to(roomId).emit("userList", Array.from(rooms.get(roomId)!.players));
      userMap.delete(socket.id);
      socket.leave(roomId);
    }
  });

  // ユーザーが切断した場合の処理(うえのと同じ)
  socket.on("disconnect", () => {
    const info = userMap.get(socket.id);
    if (info) {
      const { roomId, username } = info;
      rooms.get(roomId)?.players.delete(username);
      io.to(roomId).emit("userList", Array.from(rooms.get(roomId)!.players));
      userMap.delete(socket.id);
    }
  });

  socket.on("startGame", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = "playing";
    io.to(roomId).emit("gameStarted", { roomId });
  });

  socket.on("myName", () => {
    const userName = userMap.get(socket.id)?.username;
    socket.emit("userName", { userName });
  });
});

console.log("🚀 Socket.IO server running on http://localhost:3001");
