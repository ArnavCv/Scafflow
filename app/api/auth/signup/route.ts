import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { hashPassword, generateToken } from "@/lib/auth"
import { validateEmail, validatePassword } from "@/lib/validation"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    const pwValidation = validatePassword(password)
    if (!pwValidation.valid) {
      return NextResponse.json({ error: pwValidation.error }, { status: 400 })
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const result = await query(
      "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role",
      [email, hashedPassword, name, "site_engineer"],
    )

    const user = result.rows[0]
    const token = generateToken({ id: user.id, email: user.email, role: user.role })

    return NextResponse.json({ user, token })
  } catch (error: any) {
    console.error("[v0] Signup error:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Signup failed" }, { status: 500 })
  }
}
