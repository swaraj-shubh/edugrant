// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import clientPromise from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get('wallet');
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('edugrant');
    const user = await db.collection('users').findOne({ wallet: wallet.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { wallet, signature, message, updates } = await req.json();

    // Verify signature
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== wallet.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('edugrant');
    const users = db.collection('users');

    const result = await users.updateOne(
      { wallet: wallet.toLowerCase() },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}