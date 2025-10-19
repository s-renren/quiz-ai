"use client";

import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Role = {
  username: string;
  job: "Questioner" | "Answerer";
};

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState<Role[]>([]);

  useEffect(() => {
    // 自分の名前を取得
    socket.emit("myName");
    socket.on("userName", (data: { userName: string }) => {
      if (data.userName) {
        setUsername(data.userName);
        // 再度ルームにjoin
        socket.emit("joinGameRoom", { roomId, username: data.userName });
      }
    });

    return () => {
      socket.off("userName");
    };
  }, [roomId]);

  useEffect(() => {
    // userList 更新
    socket.on("userList", ({ users, owner }: { users: string[]; owner: string | null }) => {
      setUsers(users.map((u) => ({ username: u, job: "Answerer" })));
    });

    // 役職割り振りイベント
    socket.on("rolesAssigned", ({ roles }: { roles: Role[] }) => {
      setUsers(roles);
    });

    return () => {
      socket.off("userList");
      socket.off("rolesAssigned");
    };
  }, []);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          {username}さんのゲーム画面
        </h1>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">参加者一覧</h3>
          <ul className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-1">
            {users.map((u) => (
              <li
                key={u.username}
                className={`px-3 py-1 rounded-md text-gray-700 ${
                  u.job === "Questioner" ? "bg-yellow-100 font-semibold" : "bg-gray-100"
                }`}
              >
                {u.username} — {u.job === "Questioner" ? "出題者" : "回答者"}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
