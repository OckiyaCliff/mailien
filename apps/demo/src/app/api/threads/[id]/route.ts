import { NextResponse } from 'next/server'
import { mailien } from '@/lib/mailien'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    try {
        const thread = await mailien.getThread(id)
        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
        }
        return NextResponse.json(thread)
    } catch (error) {
        console.error('Failed to fetch thread:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
