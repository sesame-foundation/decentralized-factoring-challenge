const Web3 = require("web3");

const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

const myContractDescription = require("../artifacts/contracts/FactoringChallenge.sol/FactoringChallenge.json");
console.log(myContractDescription.contractName);

myContract = new web3.eth.Contract(
  myContractDescription.abi,
  "0x5FbDB2315678afecb367f032d93F642f64180aa3"
);

myContract.methods
  .product()
  .call()
  .then((x) => {
    console.log(x.val);
    process.exit();
  });
