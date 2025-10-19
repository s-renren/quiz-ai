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

/**
 * 🎲 部屋の中でランダムに1人を Questioner にする関数
 */
function assignRandomRoles(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const players = Array.from(room.players);
  if (players.length === 0) return;

  // ✅ ランダム選択時に範囲外にならないよう修正
  const randomIndex = Math.floor(Math.random() * players.length);
  const questioner = players[randomIndex];

  // userMap 更新
  for (const [id, user] of userMap.entries()) {
    if (user.roomId === roomId) {
      const updatedUser: User = {
        ...user,
        job: user.username === questioner ? "Questioner" : "Answerer",
      };
      userMap.set(id, updatedUser);
    }
  }

  // 全員に役職通知
  io.to(roomId).emit("rolesAssigned", {
    roles: players.map((username) => {
      const user = [...userMap.values()].find(
        (u) => u.username === username && u.roomId === roomId
      );
      return { username, job: user?.job ?? "Answerer" };
    }),
  });
}

io.on("connection", (socket) => {
  console.log("✅ A user connected", socket.id);

  // --- 通常のロビー参加 ---
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

  // --- ゲーム画面への再参加 ---
  socket.on("joinGameRoom", ({ roomId, username }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // ルーム再参加
    socket.join(roomId);
    room.players.add(username);
    userMap.set(socket.id, { roomId, username, job: "Answerer" });

    // 🎲 役職ランダム割り当て実行！
    assignRandomRoles(roomId);

    // 最新のメンバー一覧も返す
    io.to(roomId).emit("userList", {
      users: Array.from(room.players),
      owner: room.owner,
    });
  });

  // --- 自発的退出処理 ---
  socket.on("leave", () => {
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
      socket.leave(roomId);
    }
  });

  // --- 切断時処理 ---
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

  // --- ゲーム開始処理 ---
  socket.on("startGame", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.status !== "playing") {
      room.status = "playing";
    }

    // 🎲 ランダム役職割り当て関数を再利用
    assignRandomRoles(roomId);

    io.to(roomId).emit("gameStarted", { roomId });
  });

  // --- 自分の名前を返す ---
  socket.on("myName", () => {
    const userName = userMap.get(socket.id)?.username;
    socket.emit("userName", { userName });
  });

  // --- 状態取得 ---
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
