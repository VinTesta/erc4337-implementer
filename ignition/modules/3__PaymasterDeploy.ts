import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/** Modulo para deployar nosso contrato EntryPoint responsável
 *  por receber nosso User 
 */

const Paymaster = buildModule("PaymasterModule", (module) => {

  const paymaster = module.contract("Paymaster");

  return { paymaster };
});

export default Paymaster;
