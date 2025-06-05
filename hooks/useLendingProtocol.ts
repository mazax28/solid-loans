import { useEffect, useState } from "react";
import { ethers } from "ethers";
import LendingProtocolABI from "../lib/abis/LendingProtocol.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

export function useLendingProtocol() {
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [account, setAccount] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === "undefined" || !window.ethereum) return;

        const provider = new ethers.BrowserProvider(window.ethereum);
        provider.send("eth_requestAccounts", []).then(async () => {
            const signer = await provider.getSigner();
            setAccount(await signer.getAddress());

            const instance = new ethers.Contract(
                CONTRACT_ADDRESS,
                LendingProtocolABI.abi,
                signer
            );
            setContract(instance);
        });
    }, []);

    return { contract, account };
}
