import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/** Modulo para deployar nosso contrato EntryPoint responsável
 *  por receber nosso User 
 */

const EntryPoint = buildModule("EntryPointModule", (module) => {

  const entryPoint = module.contract("EntryPoint");

  return { entryPoint };
});

export default EntryPoint;
