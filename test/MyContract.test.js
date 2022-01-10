const chai = require("chai");
const { waffles } = require("hardhat");
const Web3 = require("web3");
const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
chai.use(require("chai-as-promised"));
var expect = chai.expect;
const provider = waffle.provider;
const bn = require("bn.js");

const product = 15;
const factor1 = 3;
const factor2 = 5;

function encodeInteger(integer) {
  let value_hex = new bn(integer.toString(), 10).toString("hex");
  return (
    "0x" +
    (value_hex.length % 64 != 0
      ? "0".repeat(64 - (value_hex.length % 64))
      : "") +
    value_hex
  );
}

function countBits(integer) {
  return new bn(integer.toString(), 10).bitLength();
}

function generateClaim(address, factor1, factor2) {
  console.log("Generating claim");
  let encoded = web3.eth.abi.encodeParameters(
    ["address", "bytes", "bytes"],
    [address, encodeInteger(factor1), encodeInteger(factor2)]
  );
  return web3.utils.sha3(encoded, { encoding: "hex" });
}
async function getContract(product, withdrawlDelay) {
  console.log("Getting contract");
  let MyContract = await ethers.getContractFactory("MyContract");
  let myContract = await MyContract.deploy(
    encodeInteger(product),
    withdrawlDelay
  );
  await myContract.deployed();
  return myContract;
}

describe("MyContract", () => {
  it("should have the specified product", async () => {
    const myContract = await getContract(product, 0);
    expect(
      new bn((await myContract.product())[0].slice(2), 16).toNumber()
    ).to.equal(product);
  });
  it("should keep track of submitted claims", async () => {
    const myContract = await getContract(product, 0);
    const accounts = await hre.ethers.getSigners();
    let claim = generateClaim(accounts[0].address, factor1, factor2);
    await myContract.submitClaim(claim);
    expect((await myContract.claims(claim)).gt(0)).to.be.true;
  });
  it("should not yield unsubmitted claims", async () => {
    const myContract = await getContract(product, 0);
    const accounts = await hre.ethers.getSigners();
    let claim = generateClaim(accounts[0].address, factor1, factor2);
    expect(await myContract.claims(claim)).to.equal(0);
  });
  it("should allow withdrawl of funds with a valid claim", async () => {
    const myContract = await getContract(product, 0);
    const accounts = await hre.ethers.getSigners();
    let value = ethers.BigNumber.from(100);
    await myContract.donate({ value: value });
    await myContract.submitClaim(
      generateClaim(accounts[0].address, factor1, factor2)
    );
    let startingBalance = ethers.BigNumber.from(
      await provider.getBalance(accounts[0].address)
    );
    console.log("Attempting withdrawl");
    await myContract.withdraw(encodeInteger(factor1), encodeInteger(factor2), {
      gasPrice: 0,
    });

    expect(await provider.getBalance(accounts[0].address)).to.equal(
      startingBalance.add(value)
    );
  });
  it("should not allow withdrawl of funds with an invalid claim", async () => {
    const myContract = await getContract(product, 0);
    const accounts = await hre.ethers.getSigners();
    await myContract.submitClaim(
      generateClaim(accounts[0].address, factor1 + 1, factor2)
    );

    console.log("Attempting withdrawl");
    await expect(
      myContract.withdraw(encodeInteger(factor1 + 1), encodeInteger(factor2), {
        from: accounts[0].address,
      })
    ).to.be.rejectedWith(Error);
  });
  it("should not allow withdrawl of funds without a claim", async () => {
    const myContract = await getContract(product, 0);
    const accounts = await hre.ethers.getSigners();

    console.log("Attempting withdrawl");
    await expect(
      myContract.withdraw(encodeInteger(factor1), encodeInteger(factor2), {
        from: accounts[0].address,
      })
    ).to.be.rejectedWith(Error);
  });
  it("should not allow withdrawl of funds before withdrawl delay", async () => {
    const myContract = await getContract(product, 1000);
    const accounts = await hre.ethers.getSigners();
    let value = ethers.BigNumber.from(100);
    await myContract.donate({ value: value });
    await myContract.submitClaim(
      generateClaim(accounts[0].address, factor1, factor2)
    );

    console.log("Attempting withdrawl");
    await expect(
      myContract.withdraw(encodeInteger(factor1), encodeInteger(factor2), {
        from: accounts[0].address,
      })
    ).to.be.rejectedWith(Error);
  });
  it("should accept donations", async () => {
    const myContract = await getContract(product, 0);
    let value = 100;
    await myContract.donate({ value: value });
    expect(await provider.getBalance(myContract.address)).to.equal(value);
  });
});
