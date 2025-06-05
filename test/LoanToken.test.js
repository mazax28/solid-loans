const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LoanToken", function () {
    let owner, user, token;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        const LoanToken = await ethers.getContractFactory("LoanToken");
        token = await LoanToken.deploy();
        await token.waitForDeployment();
    });

    it("permite al owner hacer mint", async function () {
        await token.mint(user.address, ethers.parseUnits("500", 18));
        const balance = await token.balanceOf(user.address);
        expect(balance.toString()).to.equal(ethers.parseUnits("500", 18).toString());
    });

    it("permite transferencias de tokens", async function () {
        await token.mint(owner.address, ethers.parseUnits("200", 18));
        await token.transfer(user.address, ethers.parseUnits("150", 18));
        const balance = await token.balanceOf(user.address);
        expect(balance.toString()).to.equal(ethers.parseUnits("150", 18).toString());
    });

    it("bloquea mint desde una cuenta que no es owner", async function () {
        await expect(
            token.connect(user).mint(user.address, ethers.parseUnits("100", 18))
        ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
});
