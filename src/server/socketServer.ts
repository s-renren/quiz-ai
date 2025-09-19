import { Server } from "socket.io";

const io = new Server(3001, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

type RoomStatus = "lobby" | "playing" | "finished";

type Room = {
  owner: string | null;
  players: Set<string>;
  status: RoomStatus;
};

type User = {
  roomId: string;
  username: string;
  job: "Questioner" | "Answerer";
  score?: number;
}

const rooms = new Map<string, Room>();
const userMap = new Map<string, User>();

io.on("connection", (socket) => {
  console.log("✅ A user connected", socket.id);

  socket.on("join", ({ roomId, username }) => {
    let room = rooms.get(roomId);
    if (!room) {
      room = { owner: username, players: new Set(), status: "lobby" };
      rooms.set(roomId, room);
    }

    if (room.status !== "lobby") {
      socket.emit("joinRejected", { reason: "ゲームは既に開始されています。" });
      return;
    }

    room.players.add(username);
    userMap.set(socket.id, { roomId, username, job: "Answerer" });
    socket.join(roomId);

    io.to(roomId).emit("userList", {
      users: Array.from(room.players),
      owner: room.owner,
    });
  });

  // ユーザーが自分の意志で退出した場合の処理
  socket.on("leave", () => {
    const info = userMap.get(socket.id);
    if (info) {
      const { roomId, username } = info;
      const room = rooms.get(roomId);
      if (!room) return;
      room.players.delete(username);
      // オーナーが抜けたら次の人に権限を渡す
      if (room.owner === username) {
        room.owner = room.players.values().next().value ?? null;
      }
      io.to(roomId).emit("userList", {
        users: Array.from(room.players),
        owner: room.owner,
      });
      userMap.delete(socket.id);
      socket.leave(roomId);
    }
  });

  // ユーザーが切断した場合の処理(うえのと同じ)
  socket.on("disconnect", () => {
    const info = userMap.get(socket.id);
    if (info) {
      const { roomId, username } = info;
      const room = rooms.get(roomId);
      if (!room) return;
      room.players.delete(username);
      if (room.owner === username) {
        room.owner = room.players.values().next().value ?? null;
      }
      io.to(roomId).emit("userList", {
        users: Array.from(room.players),
        owner: room.owner,
      });
      userMap.delete(socket.id);
    }
  });

  // TODO: ここで参加者の役職を決めるようにする
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

  socket.on("getStatus", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    socket.emit("status", { status: room.status });
  })
});

console.log("🚀 Socket.IO server running on http://localhost:3001");
