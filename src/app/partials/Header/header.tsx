"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import "./styles.css";

export default function Header() {
  const { data: session } = useSession();
  const userId = session?.user?.id || null;

  const router = useRouter();

  return (
    <header className="header">
      <h1 className="app-title">Fantasy Movie League</h1>
      <nav className="navbar">
        <Link href="/">Home</Link>
        <Link href="/login">Login</Link>
        {userId ? (
          <div className="user-links">
            <Link href={`/profile/${userId}`}>Profile</Link>
            <Link href="/create-league">Create a League</Link>
          </div>
        ) : (
          <div>
            <span>Profile</span>
          </div>
        )}
      </nav>
    </header>
  );
}
