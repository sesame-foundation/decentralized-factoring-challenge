const chai = require("chai");
const { waffles } = require("hardhat");
const Web3 = require("web3");
const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
chai.use(require("chai-as-promised"));
var expect = chai.expect;
const provider = waffle.provider;

const product = 15;
const factor1 = 3;
const factor2 = 5;

function generateClaim(address, factor1, factor2) {
  let encoded = web3.eth.abi.encodeParameters(
    ["address", "uint256", "uint256"],
    [address, factor1, factor2]
  );
  return web3.utils.sha3(encoded, { encoding: "hex" });
}

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
    const accounts = await hre.ethers.getSigners();
    await myContract.deployed();
    let claim = generateClaim(accounts[0].address, factor1, factor2);
    await myContract.submitClaim(claim);
    let result = await myContract.claims(claim);
    console.log(result);
    console.log(typeof result);
    expect((await myContract.claims(claim)).gt(0)).to.be.true;
  });
  it("should not yield unsubmitted claims", async () => {
    const MyContract = await ethers.getContractFactory("MyContract");
    const myContract = await MyContract.deploy(product);
    const accounts = await hre.ethers.getSigners();
    await myContract.deployed();
    let claim = generateClaim(accounts[0].address, factor1, factor2);
    expect(await myContract.claims(claim)).to.equal(0);
  });
  it("should allow withdrawl of funds with a valid claim", async () => {
    const MyContract = await ethers.getContractFactory("MyContract");
    const myContract = await MyContract.deploy(product);
    const accounts = await hre.ethers.getSigners();
    await myContract.deployed();
    let value = ethers.BigNumber.from(100);
    await myContract.donate({ value: value });
    await myContract.submitClaim(
      generateClaim(accounts[0].address, factor1, factor2)
    );
    let startingBalance = ethers.BigNumber.from(
      await provider.getBalance(accounts[0].address)
    );
    await myContract.withdraw(factor1, factor2, { gasPrice: 0 });

    expect(await provider.getBalance(accounts[0].address)).to.equal(
      startingBalance.add(value)
    );
  });
  it("should not allow withdrawl of funds with an invalid claim", async () => {
    const MyContract = await ethers.getContractFactory("MyContract");
    const myContract = await MyContract.deploy(product);
    const accounts = await hre.ethers.getSigners();
    await myContract.deployed();
    await myContract.submitClaim(
      generateClaim(accounts[0].address, factor1 + 1, factor2)
    );
    await expect(
      myContract.withdraw(factor1, factor2, {
        from: accounts[0].address,
      })
    ).to.be.rejectedWith(Error);
  });
  it("should not allow withdrawl of funds without a claim", async () => {
    const MyContract = await ethers.getContractFactory("MyContract");
    const myContract = await MyContract.deploy(product);
    const accounts = await hre.ethers.getSigners();
    await myContract.deployed();
    await expect(
      myContract.withdraw(factor1, factor2, {
        from: accounts[0].address,
      })
    ).to.be.rejectedWith(Error);
  });
  it("should accept donations", async () => {
    const MyContract = await ethers.getContractFactory("MyContract");
    const myContract = await MyContract.deploy(product);

    await myContract.deployed();
    let value = 100;
    await myContract.donate({ value: value });
    expect(await provider.getBalance(myContract.address)).to.equal(value);
  });
});
