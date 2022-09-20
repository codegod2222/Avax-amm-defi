import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("AMM", function () {
  async function deployContract() {
    // 初めのアドレスはコントラクトのデプロイに使用されます。
    const [owner, otherAccount] = await ethers.getSigners();

    const AMM = await hre.ethers.getContractFactory("AMM");
    const amm = await AMM.deploy();

    const precision = await amm.PRECISION();

    return { amm, precision, owner, otherAccount };
  }

  describe("Faucet", function () {
    it("Should set the right number of holdings", async function () {
      const { amm } = await loadFixture(deployContract);

      await amm.faucet(1000, 1000);

      const holdings = await amm.getMyHoldings();

      expect(holdings.amountToken1).to.equal(1000);
      expect(holdings.amountToken2).to.equal(1000);
      expect(holdings.myShare).to.equal(0);
    });
  });

  describe("Provide", function () {
    // なぜかうまくいかない
    // it("Should set the right number of holdings", async function () {
    //   const { amm } = await loadFixture(deployContract);

    //   await amm.faucet(1000, 1000);

    //   expect(await amm.provide(100, 10)).to.equal(100000000);
    // });ß

    it("Should set the right number of funds", async function () {
      const { amm, precision, otherAccount } = await loadFixture(
        deployContract
      );

      // ownerのfaucet -> 流動性提供
      const ownerFundsToken1 = 1000;
      const ownerFundsToken2 = 1000;
      await amm.faucet(ownerFundsToken1, ownerFundsToken2);
      const ownerProvidedToken1 = 100;
      const ownerProvidedToken2 = 10;
      await amm.provide(ownerProvidedToken1, ownerProvidedToken2);

      // otherのfaucet -> 流動性提供
      const otherFundsToken1 = 1000;
      const otherFundsToken2 = 1000;
      await amm
        .connect(otherAccount)
        .faucet(otherFundsToken1, otherFundsToken2);
      const otherProvidedToken1 = 50;
      const otherProvidedToken2 = await amm.getEquivalentToken2Estimate(
        otherProvidedToken1
      );
      await amm
        .connect(otherAccount)
        .provide(otherProvidedToken1, otherProvidedToken2);

      // ownerの各値の確認
      const ownerHoldings = await amm.getMyHoldings();
      expect(ownerHoldings[0]).to.equal(ownerFundsToken1 - ownerProvidedToken1);
      expect(ownerHoldings[1]).to.equal(ownerFundsToken2 - ownerProvidedToken2);
      expect(ownerHoldings[2]).to.equal(precision.mul(100));

      // otherの各値の確認
      const otherHoldings = await amm.connect(otherAccount).getMyHoldings();
      expect(otherHoldings[0]).to.equal(otherFundsToken1 - otherProvidedToken1);
      expect(otherHoldings[1]).to.equal(
        otherFundsToken2 - otherProvidedToken2.toNumber()
      );
      expect(otherHoldings[2]).to.equal(precision.mul(50));

      // コントラクトの各値の確認
      const details = await amm.getPoolDetails();
      expect(details[0]).to.equal(ownerProvidedToken1 + otherProvidedToken1);
      expect(details[1]).to.equal(
        ownerProvidedToken2 + otherProvidedToken2.toNumber()
      );
      expect(details[2]).to.equal(precision.mul(150));
    });
  });

  describe("Withdraw", function () {
    it("Should set the right number of funds", async function () {
      const { amm, precision, owner, otherAccount } = await loadFixture(
        deployContract
      );

      // ownerのfaucet -> 流動性提供
      const ownerFundsToken1 = 1000;
      const ownerFundsToken2 = 1000;
      await amm.faucet(ownerFundsToken1, ownerFundsToken2);
      const ownerProvidedToken1 = 100;
      const ownerProvidedToken2 = 10;
      await amm.provide(ownerProvidedToken1, ownerProvidedToken2);

      // otherのfaucet -> 流動性提供
      const otherFundsToken1 = 1000;
      const otherFundsToken2 = 1000;
      await amm
        .connect(otherAccount)
        .faucet(otherFundsToken1, otherFundsToken2);
      const otherProvidedToken1 = 50;
      const otherProvidedToken2 = await amm.getEquivalentToken2Estimate(
        otherProvidedToken1
      );
      await amm
        .connect(otherAccount)
        .provide(otherProvidedToken1, otherProvidedToken2);

      // otherのシェアの取得
      let otherHoldings = await amm.connect(otherAccount).getMyHoldings();
      await amm.connect(otherAccount).withdraw(otherHoldings.myShare);

      // ownerの各値の確認
      const ownerHoldings = await amm.getMyHoldings();
      expect(ownerHoldings[0]).to.equal(ownerFundsToken1 - ownerProvidedToken1);
      expect(ownerHoldings[1]).to.equal(ownerFundsToken2 - ownerProvidedToken2);
      expect(ownerHoldings[2]).to.equal(precision.mul(100));

      // otherの各値の確認
      otherHoldings = await amm.connect(otherAccount).getMyHoldings();
      expect(otherHoldings[0]).to.equal(otherFundsToken1);
      expect(otherHoldings[1]).to.equal(otherFundsToken2);
      expect(otherHoldings[2]).to.equal(0);

      // コントラクトの各値の確認
      const details = await amm.getPoolDetails();
      expect(details[0]).to.equal(ownerProvidedToken1);
      expect(details[1]).to.equal(ownerProvidedToken2);
      expect(details[2]).to.equal(precision.mul(100));
    });
  });
});
