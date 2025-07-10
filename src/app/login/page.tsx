"use client";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

import "./styles.css";

export default function Login() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // useEffect(() => {
  //   if (status === "authenticated") {
  //     router.push(`/profile/${session?.user.id}`);
  //   }
  // }, [status]);
  return (
    <div>
      <main className="login-page">
        <h1>Login Page</h1>
        <div>
          {session ? (
            <>
              <p>Welcome, {session.user?.name}</p>
              <button onClick={() => signOut()}>Sign out</button>
            </>
          ) : (
            <button onClick={() => signIn("google")}>
              Sign in with Google
            </button>
          )}
        </div>
        <button className="back-button" onClick={() => router.push("/")}>
          Back
        </button>
      </main>
    </div>
  );
}
