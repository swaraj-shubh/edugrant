// src/lib/signMessage.ts
import { ethers } from 'ethers';

export async function signMessage(
  signer: ethers.JsonRpcSigner,
  message: string
): Promise<string> {
  return await signer.signMessage(message);
}