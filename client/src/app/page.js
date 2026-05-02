"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="p-6">
      <h1 className="text-3xl mb-6">Home</h1>

      <div className="grid grid-cols-2 gap-4">

        <div
          onClick={() => router.push("/albums")}
          className="bg-[#181818] p-6 rounded-xl cursor-pointer hover:bg-[#282828]"
        >
          <h2 className="text-lg font-semibold">Albums</h2>
        </div>

        <div
          onClick={() => router.push("/library/songs")}
          className="bg-[#181818] p-6 rounded-xl cursor-pointer hover:bg-[#282828]"
        >
          <h2 className="text-lg font-semibold">All Songs</h2>
        </div>

      </div>
    </main>
  );
}