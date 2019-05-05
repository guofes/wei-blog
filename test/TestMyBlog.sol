pragma solidity ^0.5.0;

import "truffle/Assert.sol";   // 引入的断言
import "truffle/DeployedAddresses.sol";  // 用来获取被测试合约的地址
import "../contracts/MyBlog.sol";      // 被测试合约

contract TestMyBlog {
  MyBlog myBlog = MyBlog(DeployedAddresses.MyBlog());

  // 领养测试用例
  function testRegister() public {

    myBlog.register("zgl");
    uint accountNum = myBlog.getAccountNum();
    uint expected = 1;
    Assert.equal(accountNum, expected, "the first register should be recorded.");
  }

  function testRegister2() public {

    address add = myBlog.getAddByName("zgl");
    address expected = this;
    Assert.equal(add, expected, "add should record");
  }

  function testRegister3() public {

    Assert.equal(myBlog.getNameByAdd(this), "zgl", "name should record");
  }
}