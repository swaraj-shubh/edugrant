// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import clientPromise from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { wallet, role, name, college, department, businessName, signature, message } = await req.json();

    // Verify signature
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== wallet.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('edugrant');
    const users = db.collection('users');

    // Check if already exists
    const existing = await users.findOne({ wallet: wallet.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Wallet already registered' }, { status: 400 });
    }

    // Base user object
    const user: any = {
      wallet: wallet.toLowerCase(),
      role,
      name,
      createdAt: new Date(),
    };

    // Role-specific fields
    if (role === 'student') {
      user.college = college;
      user.department = department;
    } else if (role === 'vendor') {
      user.businessName = businessName;
    }
    // Donors have no extra required fields

    await users.insertOne(user);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}