"use client";

import usePlayerStore from "@/store/playerStore";

export default function Home() {
  const { currentSong, isPlaying, playSong, pauseSong } =
    usePlayerStore();

  const demoSong = {
    title: "Binks no Sake",
    artist: "Brook"
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-6">
        BinksConnect
      </h1>

      <div className="space-y-4">
        <button
          onClick={() => playSong(demoSong)}
          className="px-6 py-3 bg-green-600 rounded-xl"
        >
          Play Demo Song
        </button>

        <button
          onClick={pauseSong}
          className="px-6 py-3 bg-red-600 rounded-xl ml-4"
        >
          Pause
        </button>

        <div className="mt-6">
          <p>
            Current Song:{" "}
            {currentSong
              ? currentSong.title
              : "None"}
          </p>

          <p>
            Status:{" "}
            {isPlaying ? "Playing" : "Paused"}
          </p>
        </div>
      </div>
    </main>
  );
}