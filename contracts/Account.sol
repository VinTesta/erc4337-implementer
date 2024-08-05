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

  struct SignedMessage {
    string message;
    bytes signature;
  }

  /**
   * Essa variavel armazenar um valor ficticio para testarmos
   * se a account está realizando transações
   */
  address private owner;

  constructor(address _owner) {
    owner = _owner;
  }

  function getOwner() public view returns(address) {
    return owner;
  }

  modifier verifySignature(string memory message, bytes memory signature){
    bytes32 messageHash = keccak256(abi.encodePacked(message));
    bool isVerified = getSignerAddress(messageHash, signature) == owner;
    require(isVerified, "You can't create an smartAccount from this contract!");
    _;
  }

  function getSignerAddress(bytes32 messageHash, bytes memory signature) public pure returns (address) {
    bytes32 r;
    bytes32 s;
    uint8 v;

    assembly {
      r := mload(add(signature, 0x20))
      s := mload(add(signature, 0x40))
      v := byte(0, mload(add(signature, 0x60)))
    }

    bytes32 ethSignedMessageHash = keccak256(
      abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
    );

    return ecrecover(ethSignedMessageHash, v, r, s);
  }
  
  /**
   * A função validateUserOp é responsável por verificar
   * a UserOperation e nos traz mais segurança para a
   * SmartAccount.
   * A exemplos claros, caso alguém interaja usando essa account
   * a transação precisa ser valida para que apenas o signatario
   * correto interaja com a mesma. Para isso temos a função
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
  function execute(
      address target, 
      uint256 value, 
      bytes calldata data,
      SignedMessage calldata signedMessage) 
    external 
    verifySignature(signedMessage.message, signedMessage.signature) 
    returns (bytes memory) 
  {
    if(data.length == 0) return "";
    (bool success, bytes memory result) = target.call{value: value}(data);
    require(success, "Call failed");
    return result;
  }
}

contract AccountFactory {

  struct SignedMessage {
    string message;
    bytes signature;
  }

  modifier verifySignature(string memory message, bytes memory signature){
    bytes32 messageHash = keccak256(abi.encodePacked(message));
    bool isVerified = getSignerAddress(messageHash, signature) == owner;
    require(isVerified, "You can't create an smartAccount from this contract!");
    _;
  }

  address private owner;

  constructor() {
    owner = msg.sender;
  }

  function createAccount(address _owner, SignedMessage memory signedMessage) 
    verifySignature(signedMessage.message, signedMessage.signature) 
    external returns (address) 
  {
    Account acc = new Account(_owner);
    return address(acc);
  }

  function getSignerAddress(bytes32 messageHash, bytes memory signature) public pure returns (address) {
    bytes32 r;
    bytes32 s;
    uint8 v;

    assembly {
      r := mload(add(signature, 0x20))
      s := mload(add(signature, 0x40))
      v := byte(0, mload(add(signature, 0x60)))
    }

    bytes32 ethSignedMessageHash = keccak256(
      abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
    );

    return ecrecover(ethSignedMessageHash, v, r, s);
  }
}

contract Counter {
  uint public count;

  function iterate() external {
    count += 1;
  }
}