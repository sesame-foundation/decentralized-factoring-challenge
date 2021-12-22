const { expect } = require("chai");
const { waffles } = require("hardhat");

const provider = waffle.provider;

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
    const accounts = await hre.ethers.getSigners();

    await myContract.deployed();
    await myContract.withdraw({ from: accounts[0].address });
  });
  it("should accept donations", async () => {
    const MyContract = await ethers.getContractFactory("MyContract");
    const myContract = await MyContract.deploy(product);

    await myContract.deployed();
    let value = 1;
    await myContract.donate({ value: value });
    expect(await provider.getBalance(myContract.address)).to.equal(value);
  });
});
