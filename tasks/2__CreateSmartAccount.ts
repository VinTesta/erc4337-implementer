import { HardhatRuntimeEnvironment } from "hardhat/types";
require('dotenv').config()

export const CreateNewAccount = async (
  args: any,
  hre: HardhatRuntimeEnvironment
) => {

  const accountFactoryAddress = args.accountfactoryaddress;
  const entryPointAddress = args.entrypointaddress;
  const paymasterAddress = args.paymasteraddress;
  const accountNonce: number = args.nonce;

  if(process.env.PRIVATE_KEY === undefined) throw "PRIVATE_KEY not found in .env file";
  const ownerOfAccount = new hre.ethers.Wallet(process.env.PRIVATE_KEY);

  if (!accountFactoryAddress)
    throw "Expected argument 'accountFactoryAddress' not found";
  if (!accountNonce)
    throw "Expected argument 'nonce' not found";
  if (!entryPointAddress) 
    throw "Expected argument 'entryPointAddress' not found";

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
   * (Warning: caso mudar o nonce, a account altera. Tome cuidado
   * para não referenciar a carteira errada.)
   * Caso o nonce não seja alterado, sempre que executado uma
   * transação ela ira referenciar a mesma account.
   */
  const senderContract = await hre.ethers.getCreateAddress({
    from: accountFactoryAddress,
    nonce: accountNonce,
  });

  /**
   * Essa constante se refere ao nosso AccountFactory.
   * O método getContractFactory é responsável apenas por buscar
   * o contrato na rede. Ele é um método do próprio ethers.js
   */
  const accountFactoryContract = await hre.ethers.getContractFactory(
    "AccountFactory"
  );

  const AccountFactory = await hre.ethers.getContractAt(
    "AccountFactory",
    accountFactoryAddress
  )

  const factoryNonce = await AccountFactory.getFactoryNonce();
  const signature = await ownerOfAccount.signMessage(hre.ethers.getBytes(factoryNonce));
  
  /**
   * Aqui nós estamos capturando o initCode.
   * Ele é composto em seus primeiros 20 bytes pelo endereço
   * do AccountFactory e os próximos 20 bytes pela chamada da
   * função "encoded" que cria nossas account.
   * Caso você esteja executando a primeira vez o initCode será
   * necessário pois ele ira dizer qual a função responsável
   * por criar uma nova smartAccount. Se executarmos novamente
   * usando a nossa accounta já criada, não será necessário
   * passar o initCode. Ele pode ser igual a "0x".
   */
  const ownerSignerAddress = await ownerOfAccount.getAddress();
  const initCode =
    accountFactoryAddress +
    accountFactoryContract.interface
      .encodeFunctionData("createAccount", [accountNonce, ownerSignerAddress, signature])
      .slice(2);

  /**
   * Essa constante se refere ao nosso contrato Account
   * Vamos usa-la para capturar nosso calldata que será executado
   * na criação da smart account.
   * Esse calldata poderia ser uma transferencia, um mint...
   */
  const Account = await hre.ethers.getContractFactory("Account");
  const userOpNonce = await entryPoint.getNonce(senderContract, 0);

  const userOperation = {
    sender: senderContract,
    nonce: userOpNonce,
    initCode,
    callData: "0x",
    callGasLimit: 100_000,
    verificationGasLimit: 800_000,
    preVerificationGas: 50_000,
    maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("0", "gwei"),
    paymasterAndData: paymasterAddress || "0x",
    signature: "0x",
  };

  const tx = await entryPoint.handleOps([userOperation], ownerSignerAddress);
  const receipt = await tx.wait();

  console.log("Receipt: ", receipt);

  return {
    receipt
  };
};
