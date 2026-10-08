import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { requireOwner } from '@/lib/authServer'

export async function GET(req: NextRequest) {
  const denied = await requireOwner(req)
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20

  const db = await getDb()
  const col = db.collection('inquiries')

  const [docs, total] = await Promise.all([
    col
      .find({}, { projection: { _id: 1, name: 1, email: 1, phone: 1, checkIn: 1, checkOut: 1, guests: 1, message: 1, discovery: 1, receivedAt: 1, status: 1 } })
      .sort({ receivedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    col.countDocuments(),
  ])

  return NextResponse.json({ inquiries: docs, total, page, pages: Math.ceil(total / limit) })
}

export async function PATCH(req: NextRequest) {
  const denied = await requireOwner(req)
  if (denied) return denied

  const { id, status } = await req.json()
  const validStatuses = ['new', 'replied', 'booked']
  if (!id || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Valid id and status required' }, { status: 400 })
  }

  let oid: ObjectId
  try {
    oid = new ObjectId(id)
  } catch {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const db = await getDb()
  await db.collection('inquiries').updateOne({ _id: oid }, { $set: { status } })
  return NextResponse.json({ ok: true })
}
