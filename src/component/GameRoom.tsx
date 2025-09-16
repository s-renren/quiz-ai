"use client";

import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";

export default function GameRoom() {
  const [username, setUsername] = useState("");
  // const [joined, setJoined] = useState(false);
  // const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    socket.emit("myName");
    socket.on("userName", (data: { userName: string }) => {
      setUsername(data.userName);
    });

    return () => {
      socket.off("userName");
    };
  }, []);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          {username}さん
        </h1>
      </div>
    </main>
  );
}
