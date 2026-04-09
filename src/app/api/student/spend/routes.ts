import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import ContractABI from '@/contracts/EduGrantVault.json';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { vendorAddress, amount, studentPrivateKey } = body;

        if (!vendorAddress || !amount || !studentPrivateKey) {
            return NextResponse.json({ error: "Missing vendorAddress, amount, or studentPrivateKey." }, { status: 400 });
        }

        // 1. Connect to the Blockchain
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL!;
        const contractAddress = process.env.CONTRACT_ADDRESS!;
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // 2. Connect as the STUDENT (using their specific private key for the demo)
        const studentWallet = new ethers.Wallet(studentPrivateKey, provider);
        
        // 3. Create the contract instance connected to the STUDENT
        const contract = new ethers.Contract(contractAddress, ContractABI.abi, studentWallet);

        console.log(`Student ${studentWallet.address} is paying ${amount} to ${vendorAddress}...`);

        // 4. Execute the Purchase
        const tx = await contract.spendGrant(vendorAddress, amount);
        const receipt = await tx.wait();

        return NextResponse.json({ 
            success: true, 
            message: `Successfully paid ${amount} to vendor ${vendorAddress}`,
            txHash: receipt.hash
        });
    } catch (error: any) {
        console.error("Spend Error:", error);
        // Make contract errors easier to read for the frontend
        if (error.message.includes("Vendor is not approved")) {
            return NextResponse.json({ error: "Vendor is not approved by the University." }, { status: 400 });
        }
        if (error.message.includes("Insufficient allowance")) {
            return NextResponse.json({ error: "Insufficient grant allowance." }, { status: 400 });
        }
        return NextResponse.json({ error: "Transaction failed. Please check vendor status and balance." }, { status: 500 });
    }
}