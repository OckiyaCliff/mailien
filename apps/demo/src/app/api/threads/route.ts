import { NextResponse } from 'next/server'
import { mailien } from '@/lib/mailien'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const mailboxId = searchParams.get('mailboxId')
    const cursor = searchParams.get('cursor')

    if (!mailboxId) {
        return NextResponse.json({ error: 'mailboxId is required' }, { status: 400 })
    }

    try {
        const result = await mailien.getInbox(mailboxId, {
            cursor: cursor || undefined,
            limit: 20,
        })
        return NextResponse.json(result)
    } catch (error) {
        console.error('Failed to fetch inbox:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
