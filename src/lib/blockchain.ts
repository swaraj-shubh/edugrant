import { ethers } from "ethers";
// You will need to copy the ABI array from Remix and save it in this JSON file
import ContractABI from "../contracts/EduGrantVault.json"; 

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL!;
const privateKey = process.env.ADMIN_PRIVATE_KEY!;
const contractAddress = process.env.CONTRACT_ADDRESS!;

export const getContractInstance = () => {
    // 1. Connect to the blockchain network
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // 2. Connect your Admin/Backend wallet using the private key
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // 3. Create a writable instance of your smart contract
    const contract = new ethers.Contract(contractAddress, ContractABI.abi, wallet);
    
    return contract;
};