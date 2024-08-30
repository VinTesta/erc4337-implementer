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

  uint256 private transactionNonce = 0;

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

  modifier verifySignature(bytes memory signature){
    bytes32 messageHash = getMessage();
    bool isVerified = getSignerAddress(messageHash, signature) == owner;
    transactionNonce++;
    require(isVerified, "You can't create an smartAccount from this contract!");
    _;
  }

  function getMessage() public view returns(bytes32){
    return keccak256(abi.encodePacked(transactionNonce));
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
      bytes calldata signature) 
    external 
    verifySignature(signature) 
    returns (bytes memory) 
  {
    if(data.length == 0) return "";
    (bool success, bytes memory result) = target.call{value: value}(data);
    require(success, "Call failed");
    return result;
  } 
}

contract AccountFactory {

  mapping (uint256 => address) private accountList;
  address private owner;

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

  constructor() {
    owner = msg.sender;
  }

  function getAccountFromNonce(uint256 nonce) public view returns(address) {
    return accountList[nonce];
  }
  
  function createAccount(uint256 accountNonce, address _owner, SignedMessage memory signedMessage) 
    verifySignature(signedMessage.message, signedMessage.signature) 
    external returns (address) 
  {
    Account acc = new Account(_owner);

    accountList[accountNonce] = address(acc);
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