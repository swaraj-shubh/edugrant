import { NextResponse } from 'next/server';
import { getContractInstance } from '@/lib/blockchain';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { studentAddress, amount } = body;

        if (!studentAddress || !amount) {
            return NextResponse.json({ error: "Missing studentAddress or amount." }, { status: 400 });
        }

        // Connect as Admin/Backend
        const contract = getContractInstance();

        console.log(`Allocating ${amount} allowance to ${studentAddress}...`);

        // Execute Smart Contract Function
        const tx = await contract.assignAllowance(studentAddress, amount);
        const receipt = await tx.wait();

        return NextResponse.json({ 
            success: true, 
            message: `Successfully allocated ${amount} allowance to ${studentAddress}`,
            transactionHash: receipt.hash 
        });

    } catch (error: any) {
        console.error("Funding Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}