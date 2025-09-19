"use client";

import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";

export default function GameRoom() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    socket.emit("myName");
    socket.on("userName", (data: { userName: string }) => {
      setUsername(data.userName);
    });

    return () => {
      socket.off("userName");
    };
  }, []);

  useEffect(() => {
    const handler = ({ users }: { users: string[]; owner: string | null }) => {
      setUsers(users);
    };
    socket.on("userList", handler);

    return () => {
      socket.off("userList", handler);
    };
  }, []);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          {username}さん
        </h1>
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">参加者一覧</h3>
          <ul className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-1">
            {users.map((u) => (
              <li
                key={u}
                className="px-3 py-1 bg-gray-100 rounded-md text-gray-700"
              >
                {u}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
