"use client"

import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"

export default function SignupPage() {
  const { signup, loading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await signup(email, password, name)
    } catch (err: any) {
      setError(err?.message || "Signup failed")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8F8F8] px-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 border border-[rgba(0,0,0,0.06)]">
        <h1 className="text-2xl font-semibold text-[#0C0C0C] mb-2">Create your account</h1>
        <p className="text-sm text-[#6F6F6F] mb-6">Sign up to start managing projects in Scafflow.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#0C0C0C] mb-1">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C7C54]"
              placeholder="Ava Builder"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#0C0C0C] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C7C54]"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#0C0C0C] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C7C54]"
              placeholder="********"
              required
            />
            <p className="text-xs text-[#6F6F6F] mt-1">Min 8 characters with uppercase, lowercase, and a number.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1C7C54] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#166544] transition-colors disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-center text-[#6F6F6F] mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-[#1C7C54] font-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
