// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import '@account-abstraction/contracts/core/EntryPoint.sol';
import '@account-abstraction/contracts/interfaces/IAccount.sol';
import 'hardhat/console.sol';


/**
 * Esse contrato é responsável por gerar nossa SmartAccount,
 * básicamente ele é o que podemos chamar de "carteira".
 * Teremoa ainda uma factory responsável por gerar essas carteiras
 */
contract Account is IAccount {

  /**
   * Essa variavel armazenar um valor ficticio para testarmos
   * se a account está realizando transações
   */
  address public owner;

  constructor(address _owner) {
    owner = _owner;
  }

  /**
   * A função validateUserOp é responsável por verificar
   * a UserOperation e nos traz mais segurança para a
   * SmartAccount.
   * A exemplos claros, caso alguém interaja usando essa account
   * a transação precisa ser valida para que apenas o signatario
   * correto interja com a mesma. Para isso temos a função
   * Caso não queira realizar nenhuma validação, apenas implemente
   * um retorno com o valor 0.
   */
  function validateUserOp(
      UserOperation calldata,
      bytes32,
      uint256
  ) external pure returns (uint256 validationData) {
    return 0;
  }

  // Função genérica para executar chamadas externas
  function execute(address target, uint256 value, bytes calldata data) external returns (bytes memory) {
      (bool success, bytes memory result) = target.call{value: value}(data);
      require(success, "Call failed");
      return result;
  }
}

contract AccountFactory {
  function createAccount(address owner) external returns (address) {
    Account acc = new Account(owner);
    return address(acc);
  }
}

contract Counter {
  uint public count;

  function iterate() external {
    count += 1;
  }
}