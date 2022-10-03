import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("AMM", function () {
  async function deployContract() {
    const [owner, otherAccount] = await ethers.getSigners();

    const amountForOther = ethers.utils.parseEther("5000");
    const USDCToken = await ethers.getContractFactory("USDCToken");
    const usdc = await USDCToken.deploy();
    await usdc.faucet(otherAccount.address, amountForOther);

    const JOEToken = await ethers.getContractFactory("JOEToken");
    const joe = await JOEToken.deploy();
    await joe.faucet(otherAccount.address, amountForOther);

    const AMM = await ethers.getContractFactory("AMM");
    const amm = await AMM.deploy(usdc.address, joe.address);

    return {
      amm,
      token0: usdc,
      token1: joe,
      owner,
      otherAccount,
    };
  }

  async function deployContractWithLiquidity() {
    const { amm, token0, token1, owner, otherAccount } = await loadFixture(
      deployContract
    );

    const amountOwnerProvided0 = ethers.utils.parseEther("100");
    const amountOwnerProvided1 = ethers.utils.parseEther("200");

    await token0.approve(amm.address, amountOwnerProvided0);
    await token1.approve(amm.address, amountOwnerProvided1);
    await amm.provide(
      token0.address,
      amountOwnerProvided0,
      token1.address,
      amountOwnerProvided1
    );

    const amountOtherProvided0 = ethers.utils.parseEther("10");
    const amountOtherProvided1 = ethers.utils.parseEther("20");

    await token0
      .connect(otherAccount)
      .approve(amm.address, amountOtherProvided0);
    await token1
      .connect(otherAccount)
      .approve(amm.address, amountOtherProvided1);
    await amm
      .connect(otherAccount)
      .provide(
        token0.address,
        amountOtherProvided0,
        token1.address,
        amountOtherProvided1
      );

    return {
      amm,
      token0,
      amountOwnerProvided0,
      amountOtherProvided0,
      token1,
      amountOwnerProvided1,
      amountOtherProvided1,
      owner,
      otherAccount,
    };
  }

  describe("provide", function () {
    it("Token should be moved", async function () {
      const { amm, token0, token1, owner } = await loadFixture(deployContract);

      const ownerBalance0Before = token0.balanceOf(owner.address);
      const ownerBalance1Before = token1.balanceOf(owner.address);

      const ammBalance0Before = token0.balanceOf(amm.address);
      const ammBalance1Before = token1.balanceOf(amm.address);

      const amountProvide0 = ethers.utils.parseEther("100");
      const amountProvide1 = ethers.utils.parseEther("200");

      await token0.approve(amm.address, amountProvide0);
      await token1.approve(amm.address, amountProvide1);
      await amm.provide(
        token0.address,
        amountProvide0,
        token1.address,
        amountProvide1
      );

      expect(await token0.balanceOf(owner.address)).to.eql(
        (await ownerBalance0Before).sub(amountProvide0)
      );
      expect(await token1.balanceOf(owner.address)).to.eql(
        (await ownerBalance1Before).sub(amountProvide1)
      );

      expect(await token0.balanceOf(amm.address)).to.eql(
        (await ammBalance0Before).add(amountProvide0)
      );
      expect(await token1.balanceOf(amm.address)).to.eql(
        (await ammBalance1Before).add(amountProvide1)
      );
    });
  });

  // deployContractWithLiquidity 後の初期値のチェックをします。
  describe("Deploy with liquidity", function () {
    it("Should set the right number of amm details", async function () {
      const {
        amm,
        token0,
        amountOwnerProvided0,
        amountOtherProvided0,
        token1,
        amountOwnerProvided1,
        amountOtherProvided1,
        owner,
        otherAccount,
      } = await loadFixture(deployContractWithLiquidity);

      const precision = await amm.PRECISION();
      const BN100 = BigNumber.from("100");
      const BN10 = BigNumber.from("10");

      expect(await amm.totalShares()).to.equal(BN100.add(BN10).mul(precision));
      expect(await amm.shares(owner.address)).to.equal(BN100.mul(precision));
      expect(await amm.shares(otherAccount.address)).to.equal(
        BN10.mul(precision)
      );
      expect(await amm.totalAmount(token0.address)).to.equal(
        amountOwnerProvided0.add(amountOtherProvided0)
      );
      expect(await amm.totalAmount(token1.address)).to.equal(
        amountOwnerProvided1.add(amountOtherProvided1)
      );
    });
  });

  describe("equivalentToken", function () {
    it("Should set the right number of amm details", async function () {
      const { amm, token0, token1 } = await loadFixture(
        deployContractWithLiquidity
      );

      const totalToken0 = await amm.totalAmount(token0.address);
      const totalToken1 = await amm.totalAmount(token1.address);
      const amountProvide0 = ethers.utils.parseEther("10");
      // totalToken0 : totalToken1 = amountProvide0 : equivalentToken1
      const equivalentToken1 = amountProvide0.mul(totalToken1).div(totalToken0);

      expect(
        await amm.equivalentToken(token0.address, amountProvide0)
      ).to.equal(equivalentToken1);
    });
  });

  describe("withdrawEstimate", function () {
    it("Should get the right number of estimated amount", async function () {
      const {
        amm,
        token0,
        amountOtherProvided0,
        token1,
        amountOtherProvided1,
        otherAccount,
      } = await loadFixture(deployContractWithLiquidity);

      // otherAccountが全てのシェア分引き出し
      let share = await amm.shares(otherAccount.address);

      expect(await amm.withdrawEstimate(token0.address, share)).to.eql(
        amountOtherProvided0
      );
      expect(await amm.withdrawEstimate(token1.address, share)).to.eql(
        amountOtherProvided1
      );
    });
  });

  describe("withdraw", function () {
    it("Token should be moved", async function () {
      const {
        amm,
        token0,
        amountOwnerProvided0,
        token1,
        amountOwnerProvided1,
        owner,
      } = await loadFixture(deployContractWithLiquidity);

      const ownerBalance0Before = token0.balanceOf(owner.address);
      const ownerBalance1Before = token1.balanceOf(owner.address);

      const ammBalance0Before = token0.balanceOf(amm.address);
      const ammBalance1Before = token1.balanceOf(amm.address);

      let share = await amm.shares(owner.address);
      await amm.withdraw(share);

      expect(await token0.balanceOf(owner.address)).to.eql(
        (await ownerBalance0Before).add(amountOwnerProvided0)
      );
      expect(await token1.balanceOf(owner.address)).to.eql(
        (await ownerBalance1Before).add(amountOwnerProvided1)
      );

      expect(await token0.balanceOf(amm.address)).to.eql(
        (await ammBalance0Before).sub(amountOwnerProvided0)
      );
      expect(await token1.balanceOf(amm.address)).to.eql(
        (await ammBalance1Before).sub(amountOwnerProvided1)
      );
    });

    it("Should set the right number of amm details", async function () {
      const {
        amm,
        token0,
        amountOwnerProvided0,
        token1,
        amountOwnerProvided1,
        owner,
        otherAccount,
      } = await loadFixture(deployContractWithLiquidity);

      // otherAccountが全てのシェア分引き出し
      let share = await amm.shares(otherAccount.address);
      await amm.connect(otherAccount).withdraw(share);

      const precision = await amm.PRECISION();
      const BN100 = BigNumber.from("100");

      expect(await amm.totalShares()).to.equal(BN100.mul(precision));
      expect(await amm.shares(owner.address)).to.equal(BN100.mul(precision));
      expect(await amm.shares(otherAccount.address)).to.equal(0);
      expect(await amm.totalAmount(token0.address)).to.equal(
        amountOwnerProvided0
      );
      expect(await amm.totalAmount(token1.address)).to.equal(
        amountOwnerProvided1
      );
    });
  });

  describe("swapEstimateFromSrcToken", function () {
    it("Should get the right number of token", async function () {
      const { amm, token0, token1 } = await loadFixture(
        deployContractWithLiquidity
      );

      const totalToken0 = await amm.totalAmount(token0.address);
      const totalToken1 = await amm.totalAmount(token1.address);

      const amountSendToken0 = ethers.utils.parseEther("10");
      // basic formula: k = x * y
      const amountReceiveToken1 = amountSendToken0
        .mul(totalToken1)
        .div(totalToken0.add(amountSendToken0));

      expect(
        await amm.swapEstimateFromSrcToken(token0.address, amountSendToken0)
      ).to.eql(amountReceiveToken1);
    });
  });

  describe("swapEstimateFromDstToken", function () {
    it("Should get the right number of token", async function () {
      const { amm, token0, token1 } = await loadFixture(
        deployContractWithLiquidity
      );

      const totalToken0 = await amm.totalAmount(token0.address);
      const totalToken1 = await amm.totalAmount(token1.address);

      const amountSendToken1 = ethers.utils.parseEther("10");
      // basic formula: k = x * y
      const amountReceiveToken0 = totalToken0
        .mul(amountSendToken1)
        .div(totalToken1.sub(amountSendToken1));

      expect(
        await amm.swapEstimateFromDstToken(token1.address, amountSendToken1)
      ).to.eql(amountReceiveToken0);
    });

    it("Should revert if the amount of out token exceed the total", async function () {
      const { amm, token1, amountOwnerProvided1, amountOtherProvided1 } =
        await loadFixture(deployContractWithLiquidity);

      const amountSendToken1 = amountOwnerProvided1
        .add(amountOtherProvided1)
        .add(1);

      await expect(
        amm.swapEstimateFromDstToken(token1.address, amountSendToken1)
      ).to.be.revertedWith("Insufficient pool balance");
    });
  });

  describe("swap", function () {
    it("Should set the right number of amm details", async function () {
      const {
        amm,
        token0,
        amountOwnerProvided0,
        amountOtherProvided0,
        token1,
        amountOwnerProvided1,
        amountOtherProvided1,
      } = await loadFixture(deployContractWithLiquidity);

      const totalToken0 = await amm.totalAmount(token0.address);
      const totalToken1 = await amm.totalAmount(token1.address);

      const amountSendToken0 = ethers.utils.parseEther("10");
      // basic formula: k = x * y
      // amountReceiveToken1 = amountSendToken0 * totalToken1 / (totalToken0 + amountSendToken0)
      const amountReceiveToken1 = amountSendToken0
        .mul(totalToken1)
        .div(totalToken0.add(amountSendToken0)); //TODO これはswapEstimateで良い

      await token0.approve(amm.address, amountSendToken0);
      await amm.swap(token0.address, token1.address, amountSendToken0);

      expect(await amm.totalAmount(token0.address)).to.equal(
        amountOwnerProvided0.add(amountOtherProvided0).add(amountSendToken0)
      );
      expect(await amm.totalAmount(token1.address)).to.equal(
        amountOwnerProvided1.add(amountOtherProvided1).sub(amountReceiveToken1)
      );
    });

    it("Token should be moved", async function () {
      const {
        amm,
        token0,
        amountOwnerProvided0,
        amountOtherProvided0,
        token1,
        amountOwnerProvided1,
        amountOtherProvided1,
        owner,
        otherAccount,
      } = await loadFixture(deployContractWithLiquidity);

      const totalToken0 = await amm.totalAmount(token0.address);
      const totalToken1 = await amm.totalAmount(token1.address);

      const amountSendToken0 = ethers.utils.parseEther("10");
      // basic formula: k = x * y
      // amountReceiveToken1 = amountSendToken0 * totalToken1 / (totalToken0 + amountSendToken0)
      const amountReceiveToken1 = amountSendToken0
        .mul(totalToken1)
        .div(totalToken0.add(amountSendToken0));

      await token0.approve(amm.address, amountSendToken0);
      await amm.swap(token0.address, token1.address, amountSendToken0);

      expect(await amm.totalAmount(token0.address)).to.equal(
        amountOwnerProvided0.add(amountOtherProvided0).add(amountSendToken0)
      );
      expect(await amm.totalAmount(token1.address)).to.equal(
        amountOwnerProvided1.add(amountOtherProvided1).sub(amountReceiveToken1)
      );
    });
  });
});
