const { encodeInteger } = require("../utils.js");
let product = 15;
let withdrawlDelay = 2;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const MyContract = await ethers.getContractFactory("MyContract");
  const myContract = await MyContract.deploy(
    encodeInteger(product),
    withdrawlDelay
  );

  console.log("My Contract deployed to:", myContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
