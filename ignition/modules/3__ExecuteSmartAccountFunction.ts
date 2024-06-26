import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";

require("dotenv").config();

/** Modulo para deployar nosso contrato EntryPoint responsável
 *  por receber nosso User
 */

const ExecutedFunction = buildModule(
  "ExecuteSmartAccountFunction",
  async (module) => {
    const accountFactoryAddress = process.env.ACCOUNT_FACTORY_ADDRESS;
    const entryPointAddress = process.env.ENTRY_POINT_ADDRESS;
    const [ownerOfAccount] = await hre.ethers.getSigners();

    if (!accountFactoryAddress)
      throw "ACCOUNT_FACTORY_ADDRESS not found in .env file";
    if (!entryPointAddress) throw "ENTRY_POINT_ADDRESS not found in .env file";

    /**
     * Contrato entry point já deployado anteriormente.
     * Esse contrato vai ser responsável por receber e executar
     * nossas userOperations.
     */
    const entryPoint = await hre.ethers.getContractAt(
      "EntryPoint",
      entryPointAddress
    );

    /** A constante sender se refere ao contrato que está dando
     * origem a smart account (AccountFactory).
     * Ele é composto pelo "from" que é o endereço da AccountFactory
     * e o "nonce" que é um index para referenciar a Account.
     * Caso o nonce não seja alterado, sempre que executado uma
     * transação ela ira referenciar a mesma account.
     */
    const senderContract = await hre.ethers.getCreateAddress({
      from: accountFactoryAddress,
      nonce: 0,
    });

    /**
     * Essa constante se refere ao nosso AccountFactory.
     * O método getContractFactory é responsável apenas por buscar
     * o contrato na rede. Ele é um método do próprio ethers.js
     */
    const AccountFactory = await hre.ethers.getContractFactory(
      "AccountFactory"
    );

    /**
     * Aqui nós estamos capturando o initCode.
     * Ele é composto em seus primeiros 20 bytes pelo endereço
     * do AccountFactory e os próximos 20 bytes pela chamada da
     * função "encoded" que cria nossas account.
     */
    const ownerSignerAddress = await ownerOfAccount.getAddress();
    const initCode =
      accountFactoryAddress +
      AccountFactory.interface
        .encodeFunctionData("createAccount", [ownerSignerAddress])
        .slice(2);

    /**
     * Essa constante se refere ao nosso contrato Account
     * Vamos usa-la para capturar nosso calldata que será executado
     * na criação da smart account.
     * Esse calldata poderia ser uma transferencia, um mint...
     */
    const Account = await hre.ethers.getContractFactory("Account");

    const userOperation = {
      sender: senderContract,
      nonce: await entryPoint.getNonce(senderContract, 0),
      initCode,
      callData: Account.interface.encodeFunctionData("execute"), // Esse é o calldata que será executado na criação da smartAccount
      callGasLimit: 200_000,
      verificationGasLimit: 200_000,
      preVerificationGas: 50_000,
      maxFeePerGas: hre.ethers.parseUnits("10", "gwei"),
      maxPriorityFeePerGas: hre.ethers.parseUnits("5", "gwei"),
      paymasterAndData: "0x",
      signature: "0x",
    };

    const tx = await entryPoint.handleOps([userOperation], ownerSignerAddress);
    const receipt = await tx.wait();

    console.log("Receipt: ", receipt);

    return {
      receipt
    };
  }
);

export default ExecutedFunction;
