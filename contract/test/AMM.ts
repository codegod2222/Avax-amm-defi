import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("AMM", function () {
  async function deployContract() {
    // 初めのアドレスはコントラクトのデプロイに使用されます。
    const [owner, otherAccount] = await ethers.getSigners();

    const amountOtherAccount = ethers.utils.parseEther("5000");
    const USDCToken = await ethers.getContractFactory("USDCToken");
    const usdc = await USDCToken.deploy();
    await usdc.faucet(otherAccount.address, amountOtherAccount);

    const JOEToken = await ethers.getContractFactory("JOEToken");
    const joe = await JOEToken.deploy();
    await joe.faucet(otherAccount.address, amountOtherAccount);

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

    const OwnerProvidedToken0 = ethers.utils.parseEther("100");
    const OwnerProvidedToken1 = ethers.utils.parseEther("200");

    await token0.approve(amm.address, OwnerProvidedToken0);
    await token1.approve(amm.address, OwnerProvidedToken1);
    await amm.provide(
      token0.address,
      OwnerProvidedToken0,
      token1.address,
      OwnerProvidedToken1
    );

    const OtherProvidedToken0 = ethers.utils.parseEther("10");
    const OtherProvidedToken1 = ethers.utils.parseEther("20");

    await token0
      .connect(otherAccount)
      .approve(amm.address, OtherProvidedToken0);
    await token1
      .connect(otherAccount)
      .approve(amm.address, OtherProvidedToken1);
    await amm
      .connect(otherAccount)
      .provide(
        token0.address,
        OtherProvidedToken0,
        token1.address,
        OtherProvidedToken1
      );

    return {
      amm,
      token0,
      OwnerProvidedToken0,
      OtherProvidedToken0,
      token1,
      OwnerProvidedToken1,
      OtherProvidedToken1,
      owner,
      otherAccount,
    };
  }

  describe("Provide", function () {
    it("Should set the right number of amm details", async function () {
      const {
        amm,
        token0,
        OwnerProvidedToken0,
        OtherProvidedToken0,
        token1,
        OwnerProvidedToken1,
        OtherProvidedToken1,
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
        OwnerProvidedToken0.add(OtherProvidedToken0)
      );
      expect(await amm.totalAmount(token1.address)).to.equal(
        OwnerProvidedToken1.add(OtherProvidedToken1)
      );
    });

    it("Should get the right number of equivalent token", async function () {
      const { amm, token0, token1 } = await loadFixture(
        deployContractWithLiquidity
      );

      const totalToken0 = await amm.totalAmount(token0.address);
      const totalToken1 = await amm.totalAmount(token1.address);
      const provideToken0 = ethers.utils.parseEther("10");
      // totalToken0 : totalToken1 = provideToken0 : equivalentToken1
      const equivalentToken1 = provideToken0.mul(totalToken1).div(totalToken0);

      expect(await amm.equivalentToken(token0.address, provideToken0)).to.equal(
        equivalentToken1
      );
    });
  });

  describe("Withdraw", function () {
    it("Should set the right number of amm details", async function () {
      const {
        amm,
        token0,
        OwnerProvidedToken0,
        token1,
        OwnerProvidedToken1,
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
        OwnerProvidedToken0
      );
      expect(await amm.totalAmount(token1.address)).to.equal(
        OwnerProvidedToken1
      );
    });
  });

  // describe("Swap", function () {
  //   it("Should set the right number of funds", async function () {
  //     const { amm, usdc, joe, sharePrecision, owner, otherAccount } =
  //       await loadFixture(deployContract);

  //     // ownerの流動性提供
  //     const ownerProvidedToken1 = 100;
  //     const ownerProvidedToken2 = 10;
  //     await usdc.approve(amm.address, ownerProvidedToken1);
  //     await joe.approve(amm.address, ownerProvidedToken2);
  //     await amm.provide(
  //       usdc.address,
  //       ownerProvidedToken1,
  //       joe.address,
  //       ownerProvidedToken2
  //     );

  //     // otherの流動性提供
  //     const otherProvidedToken1 = 50;
  //     const otherProvidedToken2 = await amm.equivalentToken(
  //       usdc.address,
  //       otherProvidedToken1
  //     );
  //     await usdc
  //       .connect(otherAccount)
  //       .approve(amm.address, otherProvidedToken1);
  //     await joe.connect(otherAccount).approve(amm.address, otherProvidedToken2);
  //     await amm
  //       .connect(otherAccount)
  //       .provide(
  //         usdc.address,
  //         otherProvidedToken1,
  //         joe.address,
  //         otherProvidedToken2
  //       );

  //     // pool 150:15
  //     // token2を10swapする場合の取得できるtoken1の量(60)の確認
  //     const amountSwapJoe = 10;
  //     const amountReceiveUsdc = 60;
  //     expect(
  //       await amm.swapEstimateFromSrcToken(joe.address, amountSwapJoe)
  //     ).to.equal(amountReceiveUsdc);
  //     expect(
  //       await amm.swapEstimateFromDstToken(usdc.address, amountReceiveUsdc)
  //     ).to.equal(amountSwapJoe);
  //     //token2を10swap
  //     const amountBeforeSwapUsdc = await usdc.balanceOf(owner.address);
  //     const amountBeforeSwapJoe = await joe.balanceOf(owner.address);
  //     await joe.approve(amm.address, amountSwapJoe);
  //     await amm.swap(joe.address, usdc.address, amountSwapJoe);
  //     const amountAfterSwapUsdc = await usdc.balanceOf(owner.address);
  //     const amountAfterSwapJoe = await joe.balanceOf(owner.address);

  //     // トークン保有量の確認
  //     expect(amountAfterSwapUsdc.sub(amountBeforeSwapUsdc)).to.equal(
  //       amountReceiveUsdc
  //     );
  //     expect(amountBeforeSwapJoe.sub(amountAfterSwapJoe)).to.equal(
  //       amountSwapJoe
  //     );

  //     // コントラクトの各値の確認
  //     expect(await amm.totalAmount(usdc.address)).to.equal(
  //       ownerProvidedToken1 + otherProvidedToken1 - amountReceiveUsdc
  //     );
  //     expect(await amm.totalAmount(joe.address)).to.equal(
  //       ownerProvidedToken2 + otherProvidedToken2.toNumber() + amountSwapJoe
  //     );
  //     expect(await amm.totalShares()).to.equal(sharePrecision.mul(150));
  //   });
  // });

  // describe("test", function () {
  //   it("check behavior", async function () {
  //     const { amm, usdc, joe, sharePrecision, owner, otherAccount } =
  //       await loadFixture(deployContract);

  //     // ownerの流動性提供
  //     const ownerProvidedToken1 = 100;
  //     const ownerProvidedToken2 = 10;
  //     await usdc.approve(amm.address, ownerProvidedToken1);
  //     await joe.approve(amm.address, ownerProvidedToken2);
  //     await amm.provide(
  //       usdc.address,
  //       ownerProvidedToken1,
  //       joe.address,
  //       ownerProvidedToken2
  //     );

  //     // otherの流動性提供
  //     const otherProvidedToken1 = 50;
  //     const otherProvidedToken2 = await amm.equivalentToken(
  //       usdc.address,
  //       otherProvidedToken1
  //     );
  //     await usdc
  //       .connect(otherAccount)
  //       .approve(amm.address, otherProvidedToken1);
  //     await joe.connect(otherAccount).approve(amm.address, otherProvidedToken2);
  //     await amm
  //       .connect(otherAccount)
  //       .provide(
  //         usdc.address,
  //         otherProvidedToken1,
  //         joe.address,
  //         otherProvidedToken2
  //       );

  //     console.log(
  //       "1 -> 2のswap: 2から1を算出",
  //       await amm.swapEstimateFromDstToken(joe.address, 10)
  //     );
  //     console.log(
  //       "2 -> 1のswap: 2から1を算出",
  //       await amm.swapEstimateFromSrcToken(joe.address, 10)
  //     );
  //   });
  // });
});
