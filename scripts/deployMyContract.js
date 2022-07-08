const { encodeInteger } = require("../utils.js");

let product = "15";
let withdrawlDelay = 2;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);
  console.log("Argument 1:", encodeInteger(product));
  console.log("Argument 2:", withdrawlDelay);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const MyContract = await ethers.getContractFactory("FactoringChallenge");
  const myContract = await MyContract.deploy(
    encodeInteger(product),
    withdrawlDelay
  );

  console.log("Factoring Challenge deployed to:", myContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
