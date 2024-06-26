import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ethers";
import { task } from "hardhat/config";
import { DepositFundsToSender } from "./tasks/1__DepositFundsToSender";
import { ExecuteSmartAccountFunction } from "./tasks/2__ExecuteSmartAccountFunction";

const config: HardhatUserConfig = {
  defaultNetwork: 'localhost',
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      }
    },
  },
};

task(
  "depositFundsToSender",
  "Deposits funds to the sender on the smartAccount",
  DepositFundsToSender
)
.addParam("accountfactoryaddress", "The address of the account factory")
.addParam("entrypointaddress", "The address of the entry point");

task(
  "executeSmartAccountFunction",
  "Executes a function on the smartAccount",
  ExecuteSmartAccountFunction
)
.addParam("accountfactoryaddress", "The address of the account factory")
.addParam("entrypointaddress", "The address of the entry point");

export default config;
