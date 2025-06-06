// scripts/mint.js
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const collateralAddress = "0xe3AB3b7C39A86271C04015e00778FBd137a96aAF"; // contrato cUSD

    const Collateral = await ethers.getContractAt("CollateralToken", collateralAddress);

    const tx = await Collateral.mint(deployer.address, ethers.parseEther("100"));
    console.log("Minting TX hash:", tx.hash);
    await tx.wait();

    console.log(`✅ Minted 100 cUSD to ${deployer.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
