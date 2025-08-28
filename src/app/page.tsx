"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

export default function Home() {
  const [name, setName] = useState("");
  const router = useRouter();

  const createRoom = () => {
    if (!name) return alert("名前を入力してください");
    const roomId = nanoid(6); // 6文字のランダムID
    router.push(`/room/${roomId}?name=${encodeURIComponent(name)}`);
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>クイズ部屋を作る</h1>
      <input
        type="text"
        placeholder="名前を入力"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={createRoom}>部屋を作成</button>
    </main>
  );
}
