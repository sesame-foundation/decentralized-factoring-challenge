require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require('solidity-coverage');
require('dotenv').config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.3",
  networks: {
    mainnet: {
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1,
      url: process.env.MAINNET_URL,
    },
    ropsten: {
      accounts: [process.env.PRIVATE_KEY],
      chainId: 3,
      url: process.env.ROPSTEN_URL,
    },
    hardhat: {
      chainId: 1337,
      initialBaseFeePerGas: 0,
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
