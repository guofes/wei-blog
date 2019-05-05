pragma solidity ^0.5.0;

contract MyBlog {
  
  mapping (address => string) nickNames;
  mapping (string => address) registerNames;
  mapping (string => address) deployedContracts;
  uint totalAccounts;
  string []names;

  address admin;
  modifier onlyRegistryAdmin 
  {
    require(msg.sender == admin);
    _;
  }

  constructor() public
  {
    admin = msg.sender;
    totalAccounts = 0;
  }

  function register(string memory name) public
  {
    address add = msg.sender;
    require(registerNames[name] == address(0));
    require(bytes(nickNames[add]).length == 0);

    nickNames[add] = name;
    registerNames[name] = add;
    totalAccounts++;
    names.push(name);
  }

  function setDeployedAdd(string memory name, address add) public
  {
    require (msg.sender == registerNames[name]);
    deployedContracts[name] = add;
  }

  //can used by login or someother want to get by others name
  function getDeployedAdd(string memory name) public view returns (address contractAdd)
  {
    return deployedContracts[name];
  }

  function getAccountNum() public view returns (uint _accountNum) 
  {
    return totalAccounts;
  } 

  function getAddByName(string memory name) public view returns (address add)
  {
    return registerNames[name];
  }

  function getNameByAdd(address add) public view returns (string memory name)
  {
    return nickNames[add];
  }
  
  function randomGetName(uint randNonce) public view returns (string memory name)
  {
      uint random = uint(keccak256(abi.encodePacked(now,msg.sender,randNonce)))%totalAccounts;
      
      return names[random];
  }
  
}
