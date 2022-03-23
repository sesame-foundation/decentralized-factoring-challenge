const chai = require("chai");
chai.use(require("chai-as-promised"));
var expect = chai.expect;
const provider = waffle.provider;
const bn = require("bn.js");
const { encodeInteger } = require("../utils.js");

const product = 15;
const factor1 = 3;
const factor2 = 5;
const accountZero = '0x0000000000000000000000000000000000000000';

function generateClaim(address, factor1, factor2) {
  let encoded = ethers.utils.defaultAbiCoder.encode(
    ["address", "bytes", "bytes"],
    [address, encodeInteger(factor1), encodeInteger(factor2)]
  );
  return ethers.utils.keccak256(encoded, { encoding: "hex" });
}

async function getContract(product, withdrawlDelay) {
  let MyContract = await ethers.getContractFactory("MyContract");
  let myContract = await MyContract.deploy(
    encodeInteger(product),
    withdrawlDelay
  );
  await myContract.deployed();
  return myContract;
}

describe("MyContract", () => {
  let myContract;
  let accounts;

  beforeEach(async () => {
    myContract = await getContract(product, 0);
    accounts = await hre.ethers.getSigners();
  });

  it("should have the specified product", async () => {
    expect(
      new bn((await myContract.product())[0].slice(2), 16).toNumber()
    ).to.equal(product);
  });

  it("should keep track of submitted claims", async () => {
    let claim = generateClaim(accounts[0].address, factor1, factor2);
    await myContract.submitClaim(claim);
    expect((await myContract.claims(claim)).gt(0)).to.be.true;
  });

  it("should not yield unsubmitted claims", async () => {
    let claim = generateClaim(accounts[0].address, factor1, factor2);
    expect(await myContract.claims(claim)).to.equal(0);
  });

  describe("when challenge is unsolved", () => {
    it("should be labelled as unsolved", async () => {
      let eventFilter = myContract.filters.ChallengeSolved();
      expect((await myContract.queryFilter(eventFilter)).length).to.equal(0);
    });

    it("should accept donations", async () => {
      const value = 100;
      await myContract.donate({ value: value });
      expect(await provider.getBalance(myContract.address)).to.equal(value);
    });

    it("should not allow withdrawl of funds without a claim", async () => {
      await expect(
        myContract.withdraw(encodeInteger(factor1), encodeInteger(factor2), {
          from: accounts[0].address,
        })
      ).to.be.rejectedWith(Error);
    });

    it("should not allow withdrawl of funds with an invalid claim", async () => {
      await myContract.submitClaim(
        generateClaim(accounts[0].address, factor1 + 1, factor2)
      );

      await expect(
        myContract.withdraw(encodeInteger(factor1 + 1), encodeInteger(factor2), {
          from: accounts[0].address,
        })
      ).to.be.rejectedWith(Error);
    });

    describe("when a valid claim is submitted, but not withdrawn", () => {
      beforeEach(async () => {
        await myContract.submitClaim(
          generateClaim(accounts[0].address, factor1, factor2)
        );
      });

      it("should not have a winner", async () => {
        expect(await myContract.winner()).to.equal(accountZero);
      });

      it("should continue to accept donations", async () => {
        const value = 100;
        await myContract.donate({ value: value });
        expect(await provider.getBalance(myContract.address)).to.equal(value);
      });

      it("should continue to accept claims", async () => {
        await myContract.submitClaim(
          generateClaim(accounts[1].address, factor1, factor2)
        );
        let claim = generateClaim(accounts[1].address, factor1, factor2);
        await myContract.submitClaim(claim);
        expect((await myContract.claims(claim)).gt(0)).to.be.true;
      });

      it("should allow withdrawl of funds with a valid claim", async () => {
        const value = ethers.BigNumber.from(100);
        await myContract.donate({ value: value });
        await myContract.submitClaim(
          generateClaim(accounts[0].address, factor1, factor2)
        );
        let startingBalance = ethers.BigNumber.from(
          await provider.getBalance(accounts[0].address)
        );
        await myContract.withdraw(encodeInteger(factor1), encodeInteger(factor2), {
          gasPrice: 0,
        });
        expect(await provider.getBalance(accounts[0].address)).to.equal(
          startingBalance.add(value)
        );
      });

      it("should not allow withdrawl of funds before withdrawl delay", async () => {
        myContract = await getContract(product, 1000);
        await myContract.submitClaim(
          generateClaim(accounts[0].address, factor1, factor2)
        );

        await expect(
          myContract.withdraw(encodeInteger(factor1), encodeInteger(factor2), {
            from: accounts[0].address,
          })
        ).to.be.rejectedWith(Error);
      });
    });

    describe("when multiple valid claims are submitted, but not withdrawn", () => {
      beforeEach(async () => {
        await myContract.submitClaim(
          generateClaim(accounts[0].address, factor1, factor2)
        );
        await myContract.submitClaim(
          generateClaim(accounts[1].address, factor1, factor2)
        );
      });

      it("should allow only one withdrawal", async () => {
        await myContract.withdraw(encodeInteger(factor1), encodeInteger(factor2), {
          from: accounts[0].address,
          gasPrice: 0,
        });
        await expect(
          myContract.withdraw(encodeInteger(factor1), encodeInteger(factor2), {
            from: accounts[1].address,
            gasPrice: 0,
          })
        ).to.be.rejectedWith(Error);
      });
    });
  });

  describe("when challenge is solved", () => {
    beforeEach(async () => {
      await myContract.submitClaim(
        generateClaim(accounts[0].address, factor1, factor2)
      );
      await myContract.withdraw(encodeInteger(factor1), encodeInteger(factor2));
    });

    it("should have a winner", async () => {
      expect(await myContract.winner()).to.equal(accounts[0].address);
    });

    it("should be labelled as solved", async () => {
      let eventFilter = myContract.filters.ChallengeSolved();
      expect((await myContract.queryFilter(eventFilter)).length).to.equal(1);
    });

    it("should not accept donations", async () => {
      const value = 100;
      await expect(
        myContract.donate({ value: value })
      ).to.be.rejectedWith(Error);
    });

    it("should not accept claims", async () => {
      let claim = generateClaim(accounts[0].address, factor1, factor2);
      await expect(
        myContract.submitClaim(claim)
      ).to.be.rejectedWith(Error);
    });
  });
});
