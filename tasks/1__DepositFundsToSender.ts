import { HardhatRuntimeEnvironment } from "hardhat/types";

export const DepositFundsToSender = async (
  args: any,
  hre: HardhatRuntimeEnvironment
) => {
  const accountFactoryAddress = args.accountfactoryaddress;
  const entryPointAddress = args.entrypointaddress;

  if (!accountFactoryAddress)
    throw "Expected argument accountFactoryAddress not found";
  if (!entryPointAddress) 
    throw "Expected argument entryPointAddress not found";
  
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
   * O "nonce" diz exatamente qual carteira recebe o
   * Caso o nonce não seja alterado, sempre que executado uma
   * transação ela ira referenciar a mesma account.
   */
  const sender = await hre.ethers.getCreateAddress({
    from: accountFactoryAddress,
    nonce: 1,
  });

  const tx = await entryPoint.depositTo(sender, {
    value: hre.ethers.parseEther("1"),
  });

  const receipt = await tx.wait();

  const balance = await entryPoint.balanceOf(sender);
  console.log("New balance: ", balance.toString());

  return {
    receipt,
    balance
  };
};
