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
};

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

    if (room.status !== "playing") {
      room.status = "playing";
    }

    // プレイヤー一覧からランダムに1人選んで Questioner にする
    const players = Array.from(room.players);
    if (players.length > 0) {
      const randomIndex = Math.floor(Math.random() * players.length);
      const questioner = players[randomIndex];

      // userMap を更新
      for (const [id, user] of userMap.entries()) {
        if (user.roomId === roomId) {
          if (user.username === questioner) {
            userMap.set(id, { ...user, job: "Questioner" });
          } else {
            userMap.set(id, { ...user, job: "Answerer" });
          }
        }
      }

      // 全員に役職を通知
      io.to(roomId).emit("rolesAssigned", {
        roles: players.map((username) => {
          const user = [...userMap.values()].find(
            (u) => u.username === username && u.roomId === roomId
          );
          return { username, job: user?.job ?? "Answerer" };
        }),
      });
    }

    io.to(roomId).emit("gameStarted", { roomId });
  });

  socket.on("myName", () => {
    const userName = userMap.get(socket.id)?.username;
    socket.emit("userName", { userName });
  });

  // MEMO: ここで部屋の状態(人数、得点、役職など)を返すようにする
  socket.on("getStatus", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    socket.emit("status", {
      status: room.status,
      players: Array.from(room.players).map((username) => {
        const user = [...userMap.values()].find(
          (u) => u.username === username && u.roomId === roomId
        );
        return { username, job: user?.job ?? "Answerer" };
      }),
    });
  });
});

console.log("🚀 Socket.IO server running on http://localhost:3001");
