import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { Overrides } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

// 各アクション後のトークン残高の変化確認
describe("AMM", function () {
  async function deployContract() {
    // 初めのアドレスはコントラクトのデプロイに使用されます。
    const [owner, otherAccount] = await ethers.getSigners();

    const funds = 100;

    const amountOtherAccount = 5000;
    const USDCToken = await hre.ethers.getContractFactory("USDCToken");
    const usdc = await USDCToken.deploy();
    await usdc.faucet(otherAccount.address, amountOtherAccount);

    const JOEToken = await hre.ethers.getContractFactory("JOEToken");
    const joe = await JOEToken.deploy();
    await joe.faucet(otherAccount.address, amountOtherAccount);

    const AMM = await hre.ethers.getContractFactory("AMM");
    const amm = await AMM.deploy(usdc.address, joe.address, {
      value: funds,
    } as Overrides);

    const precision = await amm.PRECISION();

    return {
      amm,
      usdc,
      joe,
      precision,
      owner,
      otherAccount,
      amountOtherAccount,
    };
  }

  describe("Deploy", function () {
    it("Should set the right number of holdings", async function () {
      const { amm, usdc, joe, owner, otherAccount, amountOtherAccount } =
        await loadFixture(deployContract);

      expect(await usdc.balanceOf(otherAccount.address)).to.equal(
        amountOtherAccount
      );
      expect(await joe.balanceOf(otherAccount.address)).to.equal(
        amountOtherAccount
      );
      expect(await amm.shares(owner.address)).to.equal(0);
    });
  });

  describe("Provide", function () {
    // なぜかうまくいかない
    // it("Should set the right number of holdings", async function () {
    //   const { amm } = await loadFixture(deployContract);

    //   await amm.faucet(1000, 1000);

    //   expect(await amm.provide(100, 10)).to.equal(100000000);
    // });

    it("Should set the right number of funds", async function () {
      const { amm, usdc, joe, precision, owner, otherAccount } =
        await loadFixture(deployContract);

      // ownerの流動性提供
      const ownerProvidedToken1 = 100;
      const ownerProvidedToken2 = 10;
      await usdc.approve(amm.address, ownerProvidedToken1);
      await joe.approve(amm.address, ownerProvidedToken2);
      await amm.provide(
        usdc.address,
        ownerProvidedToken1,
        joe.address,
        ownerProvidedToken2
      );

      // otherの流動性提供
      const otherProvidedToken1 = 50;
      const otherProvidedToken2 = await amm.equivalentToken(
        usdc.address,
        otherProvidedToken1
      );
      await usdc
        .connect(otherAccount)
        .approve(amm.address, otherProvidedToken1);
      await joe.connect(otherAccount).approve(amm.address, otherProvidedToken2);
      await amm
        .connect(otherAccount)
        .provide(
          usdc.address,
          otherProvidedToken1,
          joe.address,
          otherProvidedToken2
        );

      // シェアの確認
      expect(await amm.shares(owner.address)).to.equal(precision.mul(100));
      expect(await amm.shares(otherAccount.address)).to.equal(
        precision.mul(50)
      );

      // コントラクトの各値の確認
      expect(await amm.totalAmount(usdc.address)).to.equal(
        ownerProvidedToken1 + otherProvidedToken1
      );
      expect(await amm.totalAmount(joe.address)).to.equal(
        ownerProvidedToken2 + otherProvidedToken2.toNumber()
      );
      expect(await amm.totalShares()).to.equal(precision.mul(150));
    });
  });

  describe("Withdraw", function () {
    it("Should set the right number of funds", async function () {
      const { amm, usdc, joe, precision, owner, otherAccount } =
        await loadFixture(deployContract);

      // ownerの流動性提供
      const ownerProvidedToken1 = 100;
      const ownerProvidedToken2 = 10;
      await usdc.approve(amm.address, ownerProvidedToken1);
      await joe.approve(amm.address, ownerProvidedToken2);
      await amm.provide(
        usdc.address,
        ownerProvidedToken1,
        joe.address,
        ownerProvidedToken2
      );

      // otherの流動性提供
      const otherProvidedToken1 = 50;
      const otherProvidedToken2 = await amm.equivalentToken(
        usdc.address,
        otherProvidedToken1
      );
      await usdc
        .connect(otherAccount)
        .approve(amm.address, otherProvidedToken1);
      await joe.connect(otherAccount).approve(amm.address, otherProvidedToken2);
      await amm
        .connect(otherAccount)
        .provide(
          usdc.address,
          otherProvidedToken1,
          joe.address,
          otherProvidedToken2
        );

      // otherのシェア分の引き出し
      let share = await amm.shares(otherAccount.address);
      await amm.connect(otherAccount).withdraw(share);

      // シェアの確認
      expect(await amm.shares(owner.address)).to.equal(precision.mul(100));
      expect(await amm.shares(otherAccount.address)).to.equal(precision.mul(0));

      // コントラクトの各値の確認
      expect(await amm.totalAmount(usdc.address)).to.equal(ownerProvidedToken1);
      expect(await amm.totalAmount(joe.address)).to.equal(ownerProvidedToken2);
      expect(await amm.totalShares()).to.equal(precision.mul(100));
    });
  });

  describe("Swap", function () {
    it("Should set the right number of funds", async function () {
      const { amm, usdc, joe, precision, owner, otherAccount } =
        await loadFixture(deployContract);

      // ownerの流動性提供
      const ownerProvidedToken1 = 100;
      const ownerProvidedToken2 = 10;
      await usdc.approve(amm.address, ownerProvidedToken1);
      await joe.approve(amm.address, ownerProvidedToken2);
      await amm.provide(
        usdc.address,
        ownerProvidedToken1,
        joe.address,
        ownerProvidedToken2
      );

      // otherの流動性提供
      const otherProvidedToken1 = 50;
      const otherProvidedToken2 = await amm.equivalentToken(
        usdc.address,
        otherProvidedToken1
      );
      await usdc
        .connect(otherAccount)
        .approve(amm.address, otherProvidedToken1);
      await joe.connect(otherAccount).approve(amm.address, otherProvidedToken2);
      await amm
        .connect(otherAccount)
        .provide(
          usdc.address,
          otherProvidedToken1,
          joe.address,
          otherProvidedToken2
        );

      // pool 150:15
      // token2を10swapする場合の取得できるtoken1の量(60)の確認
      const amountSwapJoe = 10;
      const amountReceiveUsdc = 60;
      expect(
        await amm.swapEstimateFromSrcToken(joe.address, amountSwapJoe)
      ).to.equal(amountReceiveUsdc);
      expect(
        await amm.swapEstimateFromDstToken(usdc.address, amountReceiveUsdc)
      ).to.equal(amountSwapJoe);
      //token2を10swap
      const amountBeforeSwapUsdc = await usdc.balanceOf(owner.address);
      const amountBeforeSwapJoe = await joe.balanceOf(owner.address);
      await joe.approve(amm.address, amountSwapJoe);
      await amm.swap(joe.address, usdc.address, amountSwapJoe);
      const amountAfterSwapUsdc = await usdc.balanceOf(owner.address);
      const amountAfterSwapJoe = await joe.balanceOf(owner.address);

      // トークン保有量の確認
      expect(amountAfterSwapUsdc.sub(amountBeforeSwapUsdc)).to.equal(
        amountReceiveUsdc
      );
      expect(amountBeforeSwapJoe.sub(amountAfterSwapJoe)).to.equal(
        amountSwapJoe
      );

      // コントラクトの各値の確認
      expect(await amm.totalAmount(usdc.address)).to.equal(
        ownerProvidedToken1 + otherProvidedToken1 - amountReceiveUsdc
      );
      expect(await amm.totalAmount(joe.address)).to.equal(
        ownerProvidedToken2 + otherProvidedToken2.toNumber() + amountSwapJoe
      );
      expect(await amm.totalShares()).to.equal(precision.mul(150));
    });
  });

  describe("test", function () {
    it("check behavior", async function () {
      const { amm, usdc, joe, precision, owner, otherAccount } =
        await loadFixture(deployContract);

      // ownerの流動性提供
      const ownerProvidedToken1 = 100;
      const ownerProvidedToken2 = 10;
      await usdc.approve(amm.address, ownerProvidedToken1);
      await joe.approve(amm.address, ownerProvidedToken2);
      await amm.provide(
        usdc.address,
        ownerProvidedToken1,
        joe.address,
        ownerProvidedToken2
      );

      // otherの流動性提供
      const otherProvidedToken1 = 50;
      const otherProvidedToken2 = await amm.equivalentToken(
        usdc.address,
        otherProvidedToken1
      );
      await usdc
        .connect(otherAccount)
        .approve(amm.address, otherProvidedToken1);
      await joe.connect(otherAccount).approve(amm.address, otherProvidedToken2);
      await amm
        .connect(otherAccount)
        .provide(
          usdc.address,
          otherProvidedToken1,
          joe.address,
          otherProvidedToken2
        );

      console.log(
        "1 -> 2のswap: 2から1を算出",
        await amm.swapEstimateFromDstToken(joe.address, 10)
      );
      console.log(
        "2 -> 1のswap: 2から1を算出",
        await amm.swapEstimateFromSrcToken(joe.address, 10)
      );
    });
  });
});
