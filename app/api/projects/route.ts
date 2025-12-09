import { type NextRequest, NextResponse } from "next/server"
import { ProjectService } from "@/lib/services/project-service"

const service = new ProjectService()

export async function GET(request: NextRequest) {
  const result = await service.list(request)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json(result.projects)
}

export async function POST(request: NextRequest) {
  const result = await service.create(request)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json(result.project)
}
