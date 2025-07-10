"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "../partials/Header/header";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  if (status === "loading") return <div>Loading...</div>;

  return (
    <main className="p-6">
      <Header />
      <h1 className="text-2xl font-bold">Welcome, {session?.user?.name}</h1>
      <p className="text-gray-600">{session?.user?.email}</p>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </main>
  );
}
