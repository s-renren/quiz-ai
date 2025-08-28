"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { socket } from "@/lib/socket";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function ClientRoom({ roomId }: { roomId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialName = searchParams.get("name") ?? "";

  const [username, setUsername] = useState(initialName);
  const [joined, setJoined] = useState(!!initialName);
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    if (joined && username) {
      socket.emit("join", { roomId, username });
    }

    const handler = (list: string[]) => setUsers(list);
    socket.on("userList", handler);

    return () => {
      socket.off("userList", handler);
    };
  }, [joined, roomId, username]);

  async function handleClickCopyUrl() {
    try {
      ("TODO: デプロイなどをするときはlocalhostではないので、そこをしっかりと帰るようにする");
      await navigator.clipboard.writeText(`localhost:3000/room/${roomId}`);
      toast.success("URLをクリップボードにコピーしました!!");
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>部屋ID: {roomId}</h1>
      {!joined ? (
        <div>
          <input
            type="text"
            placeholder="名前を入力"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={() => setJoined(true)}>入室する</button>
        </div>
      ) : (
        <div>
          <div>
            <Toaster />
          </div>
          <h2>{username} さんが入室しました 🎉</h2>
          <button
            onClick={() => {
              socket.emit("leave");
              setJoined(false);
              setUsers([]);
              router.push("/");
            }}
          >
            退出する
          </button>
          <br />
          <button onClick={handleClickCopyUrl}>URLをコピー</button>
          <h3>参加者一覧</h3>
          <ul>
            {users.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
