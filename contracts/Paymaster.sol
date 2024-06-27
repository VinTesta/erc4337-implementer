// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import '@account-abstraction/contracts/interfaces/IPaymaster.sol';

/**
 * O contrato de paymaster será responsável por armazenar 
 * nossos fundos e pagar pelas transações ele nada mais é 
 * do que um dummy com um pouco de ether que fica responsável
 * por bancar as transações.
 * Ele possui apenas 2 funções básicas.
 */
contract Paymaster is IPaymaster {

  /**
   * Essa é a função responsável por verificar se a transação
   * e a account que está usando o paymaster tem permissão.
   * Na implementação básica estamos apenas retornando como
   * 'true' para que ele valide, já que estamos usando no
   * localhost
   */
  function validatePaymasterUserOp(
      UserOperation calldata,
      bytes32,
      uint256
  )
      external
      override
      pure
      returns (bytes memory context, uint256 validationData)
  {
    context = new bytes(0);
    validationData = 0;
  }

  /**
   * Essa é a função responsável por executar e pagar a userOp.
   */
  function postOp(
      PostOpMode mode,
      bytes calldata context,
      uint256 actualGasCost
  ) external override {}
}