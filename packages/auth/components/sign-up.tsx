"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../client";

export const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({
      email,
      options: {
        data: {
          name,
        },
      },
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/verify-email");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      {error ? <div className="text-red-500">{error}</div> : null}
      <input
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
        type="text"
        value={name}
      />
      <input
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        type="email"
        value={email}
      />
      <input
        minLength={6}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        type="password"
        value={password}
      />
      <button disabled={loading} type="submit">
        {loading ? "Signing up..." : "Sign up"}
      </button>
    </form>
  );
};
