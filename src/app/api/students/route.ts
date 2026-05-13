// src/app/api/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const college = searchParams.get('college');
    const department = searchParams.get('department');
    const name = searchParams.get('name');
    const wallet = searchParams.get('wallet');

    const client = await clientPromise;
    const db = client.db('edugrant');
    const users = db.collection('users');

    const filter: any = { role: 'student' };

    if (college) filter.college = { $regex: college, $options: 'i' };
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (wallet) filter.wallet = wallet.toLowerCase();

    const students = await users.find(filter).project({ wallet: 1, name: 1, college: 1, department: 1 }).toArray();

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}