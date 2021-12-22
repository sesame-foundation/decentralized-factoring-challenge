const { expect } = require("chai");

const product = 15;
claim = "hello";

describe("MyContract", () => {
  it("should have the specified product", async () => {
    const MyContract = await ethers.getContractFactory("MyContract");
    const myContract = await MyContract.deploy(product);

    await myContract.deployed();
    expect(await myContract.product()).to.equal(product);
  });
  it("should keep track of submitted claims", async () => {
    const MyContract = await ethers.getContractFactory("MyContract");
    const myContract = await MyContract.deploy(product);

    await myContract.deployed();
    await myContract.submitClaim(claim);
    expect(await myContract.claims(claim)).to.be.true;
  });
  it("should allow withdrawl of funds", async () => {
    const MyContract = await ethers.getContractFactory("MyContract");
    const myContract = await MyContract.deploy(product);

    await myContract.deployed();
    await myContract.withdraw();
  });
});
