// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "./BigNumber.sol";

contract FactoringChallenge {
    mapping(bytes32 => uint256) public claims;
    address payable public winner;
    BigNumber.instance public product;
    uint256 public withdrawlDelay;
    event ChallengeSolved();

    constructor(bytes memory _product, uint256 _withdrawlDelay) {
        product.val = _product;
        product.bitlen = BigNumber.get_bit_length(_product);
        product.neg = false;
        withdrawlDelay = _withdrawlDelay;
    }

    function donate() external payable {
        require(winner == address(0), "Challenge has been solved");
    }

    function submitClaim(bytes32 _hash) public {
        require(winner == address(0), "Challenge has been solved");
        claims[_hash] = block.number;
    }

    function withdraw(bytes memory _factor1, bytes memory _factor2) public {
        require(winner == address(0), "Challenge has been solved");
        address payable claimant = payable(msg.sender);

        BigNumber.instance memory factor1;
        factor1.val = _factor1;
        factor1.bitlen = BigNumber.get_bit_length(_factor1);
        factor1.neg = false;

        BigNumber.instance memory factor2;
        factor2.val = _factor2;
        factor2.bitlen = BigNumber.get_bit_length(_factor2);
        factor2.neg = false;

        BigNumber.instance memory one;
        one.val = new bytes(32);
        one.val[31] = 0x01;
        one.bitlen = BigNumber.get_bit_length(one.val);
        one.neg = false;

        require(BigNumber.cmp(factor1, one, true) != 0, "Trivial factors");
        require(BigNumber.cmp(factor2, one, true) != 0, "Trivial factors");

        bytes32 hash = keccak256(abi.encode(msg.sender, _factor1, _factor2));
        uint256 claimBlockNumber = claims[hash];
        require(claimBlockNumber > 0, "Claim not found");
        require(
            block.number - claimBlockNumber > withdrawlDelay,
            "Not enough blocks mined since claim was submitted"
        );

        require(
            BigNumber.cmp(BigNumber.bn_mul(factor1, factor2), product, true) ==
                0,
            "Invalid factors"
        );

        winner = claimant;
        emit ChallengeSolved();

        (bool sent, bytes memory data) = claimant.call{
            value: address(this).balance
        }("");
        require(sent, "Failed to send Ether");
    }
}
