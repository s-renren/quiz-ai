"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

export default function Home() {
  const [name, setName] = useState("");
  const router = useRouter();

  const createRoom = () => {
    if (!name) return alert("名前を入力してください");
    const roomId = nanoid(6);
    router.push(`/room/${roomId}?name=${encodeURIComponent(name)}`);
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          名前を入力してください
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="名前を入力"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-gray-700"
          />
          <button
            onClick={createRoom}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            部屋を作成
          </button>
        </div>
      </div>
    </main>
  );
}
