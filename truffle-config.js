require("babel-register");
require("babel-polyfill");
const HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic =
  "pass trash sign point cake enjoy public supply hunt upon reject supreme";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(
          mnemonic,
          "https://rinkeby.infura.io/v3/1194a83d8d16417cb5ec0de60deba7d7"
        );
      },
      network_id: 4,
      gas: 10000000,
      gasPrice: 10000000000,
    },
    matic: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://rpc-mumbai.matic.today");
      },
      network_id: 80001,
      gas: 10000000,
      gasPrice: 10000000000,
    },
  },
  contracts_directory: "./src/contracts/",
  contracts_build_directory: "./src/abis/",
  compilers: {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
