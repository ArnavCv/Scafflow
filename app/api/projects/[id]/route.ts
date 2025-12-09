import { type NextRequest, NextResponse } from "next/server"
import { ProjectService } from "@/lib/services/project-service"

const service = new ProjectService()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await service.get(request, id)
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json(result.project)
  } catch (error) {
    console.error("[v0] Get project error:", error)
    return NextResponse.json({ error: "Failed to get project" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await service.update(request, id)
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json(result.project)
  } catch (error) {
    console.error("[v0] Update project error:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}
