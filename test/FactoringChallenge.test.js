const chai = require("chai");
chai.use(require("chai-as-promised"));
var expect = chai.expect;
const provider = waffle.provider;
const bn = require("bn.js");
const {
  encodeInteger,
  encodeIntegerImproper,
  encodeIntegerExtraPadding,
  generateClaim,
} = require("../utils.js");

const product = 15;
const factor1 = 3;
const factor2 = 5;
const accountZero = "0x0000000000000000000000000000000000000000";
const salt = "0x1234";

async function getContract(product, withdrawlDelay) {
  let MyContract = await ethers.getContractFactory("FactoringChallenge");
  let myContract = await MyContract.deploy(
    encodeInteger(product),
    withdrawlDelay
  );
  await myContract.deployed();
  return myContract;
}

describe("FactoringChallenge", () => {
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
    let claim = generateClaim(
      accounts[0].address,
      encodeInteger(factor1),
      encodeInteger(factor2),
      salt
    );
    await myContract.submitClaim(claim);
    expect((await myContract.claims(claim)).gt(0)).to.be.true;
  });

  it("should not yield unsubmitted claims", async () => {
    let claim = generateClaim(
      accounts[0].address,
      encodeInteger(factor1),
      encodeInteger(factor2),
      salt
    );
    expect(await myContract.claims(claim)).to.equal(0);
  });

  describe("when challenge is unsolved", () => {
    it("should be labelled as unsolved", async () => {
      let eventFilter = myContract.filters.ChallengeSolved();
      expect((await myContract.queryFilter(eventFilter)).length).to.equal(0);
    });

    describe("donate", () => {
      it("should accept donations", async () => {
        const value = 100;
        await myContract.donate({ value: value });
        expect(await provider.getBalance(myContract.address)).to.equal(value);
      });

      it("should emit a Donation event", async () => {
        const value = 100;
        await myContract.donate({ value: value });
        const logs = await provider.getLogs({});
        const event = myContract.interface.parseLog(logs[0]);
        expect(event.name).to.eq("Donation");
        expect(event.args[0]).to.eq(accounts[0].address);
        expect(event.args[1]).to.eq(value);
      });
    });

    it("should not allow withdrawl of funds without a claim", async () => {
      await expect(
        myContract.withdraw(
          encodeInteger(factor1),
          encodeInteger(factor2),
          salt,
          {
            from: accounts[0].address,
          }
        )
      ).to.be.rejectedWith(Error);
    });

    it("should not allow withdrawl of funds with a claim with incorrect factors", async () => {
      await myContract.submitClaim(
        generateClaim(
          accounts[0].address,
          encodeInteger(factor1 + 1),
          encodeInteger(factor2),
          salt
        )
      );

      await expect(
        myContract.withdraw(
          encodeInteger(factor1 + 1),
          encodeInteger(factor2),
          salt,
          {
            from: accounts[0].address,
          }
        )
      ).to.be.rejectedWith(Error);
    });

    it("should not allow withdrawl of funds with a claim with trivial factors", async () => {
      await myContract.submitClaim(
        generateClaim(
          accounts[0].address,
          encodeInteger(product),
          encodeInteger(1),
          salt
        )
      );

      await expect(
        myContract.withdraw(encodeInteger(product), encodeInteger(1), {
          from: accounts[0].address,
        })
      ).to.be.rejectedWith(Error);
    });

    it("should not allow withdrawl of funds with an improperly encoded factor", async () => {
      await myContract.submitClaim(
        generateClaim(
          accounts[0].address,
          encodeIntegerImproper(factor1),
          encodeInteger(factor2),
          salt
        )
      );

      await expect(
        myContract.withdraw(
          encodeIntegerImproper(factor1),
          encodeInteger(factor2),
          salt,
          {
            from: accounts[0].address,
          }
        )
      ).to.be.rejectedWith(Error);
    });

    it("should not allow withdrawl of funds with a claim with trivial factors with extra padding", async () => {
      await myContract.submitClaim(
        generateClaim(
          accounts[0].address,
          encodeInteger(product),
          encodeIntegerExtraPadding(1),
          salt
        )
      );
      await expect(
        myContract.withdraw(
          encodeInteger(product),
          encodeIntegerExtraPadding(1),
          salt,
          {
            from: accounts[0].address,
          }
        )
      ).to.be.rejectedWith(Error);
    });

    describe("when a valid claim is submitted, but not withdrawn", () => {
      beforeEach(async () => {
        await myContract.submitClaim(
          generateClaim(
            accounts[0].address,
            encodeInteger(factor1),
            encodeInteger(factor2),
            salt
          )
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
          generateClaim(
            accounts[1].address,
            encodeInteger(factor1),
            encodeInteger(factor2),
            salt
          )
        );
        let claim = generateClaim(
          accounts[1].address,
          encodeInteger(factor1),
          encodeInteger(factor2),
          salt
        );
        await myContract.submitClaim(claim);
        expect((await myContract.claims(claim)).gt(0)).to.be.true;
      });

      it("should allow withdrawl of funds with a valid claim", async () => {
        const value = ethers.BigNumber.from(100);
        await myContract.donate({ value: value });
        await myContract.submitClaim(
          generateClaim(
            accounts[0].address,
            encodeInteger(factor1),
            encodeInteger(factor2),
            salt
          )
        );
        let startingBalance = ethers.BigNumber.from(
          await provider.getBalance(accounts[0].address)
        );
        await myContract.withdraw(
          encodeInteger(factor1),
          encodeInteger(factor2),
          salt,
          {
            gasPrice: 0,
          }
        );
        expect(await provider.getBalance(accounts[0].address)).to.equal(
          startingBalance.add(value)
        );
      });

      it("should not allow withdrawl of funds before withdrawl delay", async () => {
        myContract = await getContract(product, 1000);
        await myContract.submitClaim(
          generateClaim(
            accounts[0].address,
            encodeInteger(factor1),
            encodeInteger(factor2),
            salt
          )
        );

        await expect(
          myContract.withdraw(
            encodeInteger(factor1),
            encodeInteger(factor2),
            salt,
            {
              from: accounts[0].address,
            }
          )
        ).to.be.rejectedWith(Error);
      });

      it("should not allow withdrawl of funds with the incorrect salt", async () => {
        const value = ethers.BigNumber.from(100);
        await myContract.donate({ value: value });
        await myContract.submitClaim(
          generateClaim(
            accounts[0].address,
            encodeInteger(factor1),
            encodeInteger(factor2),
            salt
          )
        );

        await expect(
          myContract.withdraw(
            encodeInteger(factor1),
            encodeInteger(factor2),
            "0x1235",
            {
              from: accounts[0].address,
            }
          )
        ).to.be.rejectedWith(Error);
      });
    });

    describe("when multiple valid claims are submitted, but not withdrawn", () => {
      beforeEach(async () => {
        await myContract.submitClaim(
          generateClaim(
            accounts[0].address,
            encodeInteger(factor1),
            encodeInteger(factor2),
            salt
          )
        );
        await myContract.submitClaim(
          generateClaim(
            accounts[1].address,
            encodeInteger(factor1),
            encodeInteger(factor2),
            salt
          )
        );
      });

      it("should allow only one withdrawal", async () => {
        await myContract.withdraw(
          encodeInteger(factor1),
          encodeInteger(factor2),
          salt,
          {
            from: accounts[0].address,
            gasPrice: 0,
          }
        );
        await expect(
          myContract.withdraw(
            encodeInteger(factor1),
            encodeInteger(factor2),
            salt,
            {
              from: accounts[1].address,
              gasPrice: 0,
            }
          )
        ).to.be.rejectedWith(Error);
      });
    });
  });

  describe("when challenge is solved", () => {
    beforeEach(async () => {
      await myContract.submitClaim(
        generateClaim(
          accounts[0].address,
          encodeInteger(factor1),
          encodeInteger(factor2),
          salt
        )
      );
      await myContract.withdraw(
        encodeInteger(factor1),
        encodeInteger(factor2),
        salt
      );
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
      await expect(myContract.donate({ value: value })).to.be.rejectedWith(
        Error
      );
    });

    it("should not accept claims", async () => {
      let claim = generateClaim(
        accounts[0].address,
        encodeInteger(factor1),
        encodeInteger(factor2),
        salt
      );
      await expect(myContract.submitClaim(claim)).to.be.rejectedWith(Error);
    });
  });
});
