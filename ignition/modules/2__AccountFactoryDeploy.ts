import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/** Modulo para deployar nosso contrato EntryPoint responsável
 *  por receber nosso User 
 */

const AccountFactory = buildModule("AccountFactoryModule", (module) => {

  const accountFactory = module.contract("AccountFactory");
  const counter = module.contract("Counter");

  return { accountFactory, counter };
});

export default AccountFactory;
