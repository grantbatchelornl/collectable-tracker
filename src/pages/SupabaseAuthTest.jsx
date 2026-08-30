import { useState } from 'react';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  getCurrentUser,
} from '@/lib/supabaseAuth';

export default function SupabaseAuthTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [output, setOutput] = useState('');

  const run = async (fn) => {
    try {
      const result = await fn();
      setOutput(JSON.stringify(result, null, 2));
    } catch (err) {
      setOutput(String(err));
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Supabase Auth Test</h1>

      <input
        className="w-full border rounded p-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full border rounded p-2"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={() => run(() => signUpWithEmail(email, password))}>
        Sign Up
      </button>

      <button onClick={() => run(() => signInWithEmail(email, password))}>
        Sign In
      </button>

      <button onClick={() => run(signInWithGoogle)}>
        Continue with Google
      </button>

      <button onClick={() => run(getCurrentUser)}>
        Check Current User
      </button>

      <button onClick={() => run(signOut)}>
        Sign Out
      </button>

      <pre className="text-xs whitespace-pre-wrap border rounded p-3">
        {output}
      </pre>
    </div>
  );
}
