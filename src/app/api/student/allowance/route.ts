import { NextResponse } from 'next/server';
import { getContractInstance } from '@/lib/blockchain';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { studentAddress, amount } = body;

        const contract = getContractInstance();
        
        // Grant the virtual allowance on-chain
        const tx = await contract.assignAllowance(studentAddress, amount);
        const receipt = await tx.wait();

        return NextResponse.json({ 
            success: true, 
            message: `Allocated ${amount} to student ${studentAddress}`,
            txHash: receipt.hash
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}