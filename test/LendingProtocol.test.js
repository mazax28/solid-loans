const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingProtocol - Pruebas completas", function () {
    let owner, user;
    let collateralToken, loanToken, lendingProtocol;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        const CollateralToken = await ethers.getContractFactory("CollateralToken");
        collateralToken = await CollateralToken.deploy();
        await collateralToken.waitForDeployment();

        const LoanToken = await ethers.getContractFactory("LoanToken");
        loanToken = await LoanToken.deploy();
        await loanToken.waitForDeployment();

        const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
        lendingProtocol = await LendingProtocol.deploy(
            await collateralToken.getAddress(),
            await loanToken.getAddress()
        );
        await lendingProtocol.waitForDeployment();

        // ✅ Primero mint, luego ownership
        await loanToken.mint(owner.address, ethers.parseUnits("1000", 18));
        await loanToken.transferOwnership(await lendingProtocol.getAddress());

        await collateralToken.mint(user.address, ethers.parseUnits("1000", 18));
    });


    it("deposita correctamente colateral", async function () {
        const amount = ethers.parseUnits("500", 18);

        await collateralToken.connect(user).approve(await lendingProtocol.getAddress(), amount);
        await lendingProtocol.connect(user).depositCollateral(amount);

        const userData = await lendingProtocol.getUserData(user.address);
        expect(userData[0].toString()).to.equal(amount.toString());
    });

    it("solicita préstamo correctamente", async function () {
        const depositAmount = ethers.parseUnits("600", 18);
        const expectedLoan = ethers.parseUnits("400", 18); // 600 / 1.5

        await collateralToken.connect(user).approve(await lendingProtocol.getAddress(), depositAmount);
        await lendingProtocol.connect(user).depositCollateral(depositAmount);
        await lendingProtocol.connect(user).borrow(expectedLoan);

        const userData = await lendingProtocol.getUserData(user.address);
        expect(userData[1].toString()).to.equal(expectedLoan.toString());

        const balance = await loanToken.balanceOf(user.address);
        expect(balance.toString()).to.equal(expectedLoan.toString());
    });

    it("rechaza préstamo si colateral es insuficiente", async function () {
        const depositAmount = ethers.parseUnits("150", 18);
        const loanRequest = ethers.parseUnits("200", 18);

        await collateralToken.connect(user).approve(await lendingProtocol.getAddress(), depositAmount);
        await lendingProtocol.connect(user).depositCollateral(depositAmount);

        await expect(
            lendingProtocol.connect(user).borrow(loanRequest)
        ).to.be.revertedWith("Excede el limite de prestamo");
    });

    it("permite pagar la deuda y el interés", async function () {
        const depositAmount = ethers.parseUnits("600", 18);
        const loanAmount = ethers.parseUnits("400", 18);

        const interest = (loanAmount * 5n) / 100n;
        const totalToRepay = loanAmount + interest;


        await collateralToken.connect(user).approve(await lendingProtocol.getAddress(), depositAmount);
        await lendingProtocol.connect(user).depositCollateral(depositAmount);
        await lendingProtocol.connect(user).borrow(loanAmount);

        await loanToken.connect(owner).transfer(user.address, interest);
        console.log("Balance user antes de repay:", (await loanToken.balanceOf(user.address)).toString());
        console.log("Total a pagar:", totalToRepay.toString());

        await loanToken.connect(user).approve(await lendingProtocol.getAddress(), totalToRepay);


        await lendingProtocol.connect(user).repay();

        const userData = await lendingProtocol.getUserData(user.address);
        expect(userData[1].toString()).to.equal("0");
        expect(userData[2].toString()).to.equal("0");
    });


    it("rechaza repay si no hay deuda", async function () {
        await expect(
            lendingProtocol.connect(user).repay()
        ).to.be.revertedWith("No hay deuda");
    });

    it("permite retirar colateral si no hay deuda", async function () {
        const amount = ethers.parseUnits("300", 18);

        await collateralToken.connect(user).approve(await lendingProtocol.getAddress(), amount);
        await lendingProtocol.connect(user).depositCollateral(amount);

        await lendingProtocol.connect(user).withdrawCollateral();

        const userData = await lendingProtocol.getUserData(user.address);
        expect(userData[0].toString()).to.equal("0");

        const balance = await collateralToken.balanceOf(user.address);
        expect(balance.toString()).to.equal(ethers.parseUnits("1000", 18).toString());
    });

    it("rechaza retiro si hay deuda activa", async function () {
        const depositAmount = ethers.parseUnits("600", 18);
        const loanAmount = ethers.parseUnits("400", 18);

        await collateralToken.connect(user).approve(await lendingProtocol.getAddress(), depositAmount);
        await lendingProtocol.connect(user).depositCollateral(depositAmount);
        await lendingProtocol.connect(user).borrow(loanAmount);

        await expect(
            lendingProtocol.connect(user).withdrawCollateral()
        ).to.be.revertedWith("Primero paga la deuda");
    });

    it("rechaza depósito con cantidad cero", async function () {
        await collateralToken.connect(user).approve(await lendingProtocol.getAddress(), 0);
        await expect(
            lendingProtocol.connect(user).depositCollateral(0)
        ).to.be.revertedWith("Cantidad invalida");
    });

    it("rechaza retiro si no hay colateral disponible", async function () {
        // El usuario nunca depositó nada, así que collateralAmount = 0
        await expect(
            lendingProtocol.connect(user).withdrawCollateral()
        ).to.be.revertedWith("Nada para retirar");
    });

    it("rechaza si transferFrom falla", async function () {
        const MockFailToken = await ethers.getContractFactory("MockFailToken");
        const failToken = await MockFailToken.deploy();
        await failToken.waitForDeployment();

        const LendingProtocol = await ethers.getContractFactory("LendingProtocol");
        const badProtocol = await LendingProtocol.deploy(
            await failToken.getAddress(),
            await loanToken.getAddress()
        );
        await badProtocol.waitForDeployment();

        await expect(
            badProtocol.connect(user).depositCollateral(ethers.parseUnits("100", 18))
        ).to.be.revertedWith("Transferencia fallida");
    });

    it("rechaza préstamo que excede el límite de colateral", async function () {
        const depositAmount = ethers.parseUnits("150", 18);
        const loanRequest = ethers.parseUnits("200", 18);

        await collateralToken.connect(user).approve(await lendingProtocol.getAddress(), depositAmount);
        await lendingProtocol.connect(user).depositCollateral(depositAmount);

        await expect(
            lendingProtocol.connect(user).borrow(loanRequest)
        ).to.be.revertedWith("Excede el limite de prestamo");
    });

    it("permite préstamo justo al límite de colateralización", async function () {
        const depositAmount = ethers.parseUnits("150", 18); // → maxBorrow = 100
        const loanAmount = ethers.parseUnits("100", 18); // exactamente al límite

        await collateralToken.connect(user).approve(await lendingProtocol.getAddress(), depositAmount);
        await lendingProtocol.connect(user).depositCollateral(depositAmount);

        await lendingProtocol.connect(user).borrow(loanAmount); // <- esta línea cubre la segunda rama
    });

    it("rechaza préstamo si no tiene colateral", async function () {
        const loanAmount = ethers.parseUnits("100", 18);

        await expect(
            lendingProtocol.connect(user).borrow(loanAmount)
        ).to.be.revertedWith("No hay colateral");
    });



});
