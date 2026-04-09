import { NextResponse } from 'next/server';
import { getContractInstance } from '@/lib/blockchain';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { vendorAddress, isApproved } = body;

        if (!vendorAddress) {
            return NextResponse.json({ error: "Vendor address is required." }, { status: 400 });
        }

        // Connect as Admin
        const contract = getContractInstance();
        
        console.log(`Setting vendor ${vendorAddress} whitelist status to ${isApproved}...`);
        
        // Execute Smart Contract Function
        const tx = await contract.setVendorStatus(vendorAddress, isApproved);
        const receipt = await tx.wait();

        return NextResponse.json({ 
            success: true, 
            message: `Vendor ${vendorAddress} whitelist status set to ${isApproved}`,
            txHash: receipt.hash
        });
    } catch (error: any) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}