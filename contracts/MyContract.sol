// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

contract MyContract {
    mapping(string => bool) public claims;
    int256 public product;

    receive() external payable {}

    constructor(int256 _product) {
        product = _product;
    }

    function submitClaim(string memory _hash) public {
        claims[_hash] = true;
    }

    function withdraw() public {
        address payable claimant = payable(msg.sender);
        (bool sent, bytes memory data) = claimant.call{
            value: address(this).balance
        }("");
        require(sent, "Failed to send Ether");
    }
}
