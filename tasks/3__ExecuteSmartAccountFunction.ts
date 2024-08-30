import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * ! ESSA É APENAS UMA TASK DE EXEMPLO
 * O intuito dessa task é mostrar a execução de uma função
 * genérica usando nossa SmartAccount
 */

export const ExecuteSmartAccountFunction = async (
  args: any,
  hre: HardhatRuntimeEnvironment
) => {

  const accountFactoryAddress = args.accountfactoryaddress;
  const entryPointAddress = args.entrypointaddress;
  const paymasterAddress = args.paymasteraddress;
  const targetContract = args.target;
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
  const AccountFactory = await hre.ethers.getContractFactory(
    "AccountFactory"
  );

  const deployedAccountFactory = await hre.ethers.getContractAt(
    'AccountFactory',
    accountFactoryAddress
  )

  const contractAddress = await deployedAccountFactory.getAccountFromNonce(accountNonce);
  const deployedAccount = await hre.ethers.getContractAt('Account', contractAddress);

  /**
   * Essa mensagem deve ser assinada pela mesma carteira que criou a smart account
   * para garantir que a execução da função seja feita pelo dono da conta.
   * Case qualquer outra carteira assine a mesma, o contrato irá rejeitar a execução.
   */
  const txNonce = await deployedAccount.getMessage();
  const signature = await ownerOfAccount.signMessage(hre.ethers.getBytes(txNonce));

  const ownerSignerAddress = await ownerOfAccount.getAddress();

  /**
   * Essa constante se refere ao nosso contrato Account
   * Vamos usa-la para capturar nosso calldata que será executado
   * na criação da smart account.
   * Esse calldata poderia ser uma transferencia, um mint...
   */
  const Account = await hre.ethers.getContractFactory("Account");
  const Counter = await hre.ethers.getContractFactory("Counter");
  const userOpNonce = await entryPoint.getNonce(senderContract, 0);

  const userOperation = {
    sender: senderContract,
    nonce: userOpNonce,
    initCode: "0x",
    callData: Account.interface.encodeFunctionData(
      "execute", 
      [
        targetContract, 
        0, 
        Counter.interface.encodeFunctionData("iterate", []),
        signature
      ]),
    callGasLimit: 200_000,
    verificationGasLimit: 200_000,
    preVerificationGas: 50_000,
    maxFeePerGas: hre.ethers.parseUnits("10", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("5", "gwei"),
    paymasterAndData: paymasterAddress || "0x",
    signature: "0x",
  };

  const tx = await entryPoint.handleOps([userOperation], ownerSignerAddress);
  const receipt = await tx.wait();

  const count = await Counter.attach(targetContract).count();
  console.log("Count: ", count);

  console.log("Receipt: ", receipt);

  return {
    receipt
  };
};
