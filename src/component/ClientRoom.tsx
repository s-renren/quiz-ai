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
  const [owner, setOwner] = useState<string | null>(null);

  useEffect(() => {
    const rejectHandler = ({ reason }: { reason: string }) => {
      toast.error(reason);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    };
    socket.on("joinRejected", rejectHandler);

    return () => {
      socket.off("joinRejected", rejectHandler);
    };
  }, [router]);

  useEffect(() => {
    // 新しく参加した場合のみ作動
    if (joined && username) {
      socket.emit("join", { roomId, username });
    }

    const handler = ({
      users,
      owner,
    }: {
      users: string[];
      owner: string | null;
    }) => {
      setUsers(users);
      setOwner(owner);
    };
    socket.on("userList", handler);

    const gameHandler = ({ roomId }: { roomId: string }) => {
      router.push(`/room/${roomId}/game`);
    };
    socket.on("gameStarted", gameHandler);

    return () => {
      socket.off("userList", handler);
      socket.off("gameStarted", gameHandler);
    };
  }, [joined, roomId, username, router]);

  async function handleClickCopyUrl() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/room/${roomId}`
      );
      toast.success("URLをクリップボードにコピーしました!!");
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          部屋ID: <span className="text-indigo-600">{roomId}</span>
        </h1>

        {!joined ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="名前を入力"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              onClick={() => setJoined(true)}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              入室する
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <Toaster />

            <h2 className="text-xl font-semibold text-gray-700 text-center">
              {username} さんが入室しました
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  socket.emit("leave");
                  setJoined(false);
                  setUsers([]);
                  router.push("/");
                }}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                退出する
              </button>
              <button
                onClick={handleClickCopyUrl}
                className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                部屋のURLをコピー
              </button>
              {owner === username && (
                <button
                  onClick={() => {
                    socket.emit("startGame", { roomId });
                    router.push(`/game/${roomId}`);
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  ゲームを開始
                </button>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                参加者一覧
              </h3>
              <ul className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-1">
                {users.length > 0 ? (
                  users.map((u) => (
                    <li
                      key={u}
                      className="px-3 py-1 bg-gray-100 rounded-md text-gray-700"
                    >
                      {u}
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">まだ参加者はいません</p>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
