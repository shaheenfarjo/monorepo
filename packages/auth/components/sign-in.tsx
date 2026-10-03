"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../client";

export const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSignIn}>
      {error ? <div className="text-red-500">{error}</div> : null}
      <input
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        type="email"
        value={email}
      />
      <input
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        type="password"
        value={password}
      />
      <button disabled={loading} type="submit">
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
};
