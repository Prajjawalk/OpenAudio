// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVC} from "./interfaces/IVC.sol";

contract MockIVC is IVC {
    mapping(address => bool) public verified;

    /// @notice Set the verification status for a given user address.
    function setVerified(address user, bool status) external {
        verified[user] = status;
    }

    /// @notice Returns the verification status of a user.
    function isVerified(address user) external view override returns (bool) {
        return verified[user];
    }

    // Dummy implementations for the rest of the interface:

    function totalUsers() external pure override returns (uint256) {
        return 0;
    }

    function totalVerifiedUsers() external pure override returns (uint256) {
        return 0;
    }

    function getUser(address) external pure override returns (User memory) {
        revert("Not implemented");
    }

    function isRegistered(address) external pure override returns (bool) {
        return false;
    }

    function getReferrersTree(address) external pure override returns (address[] memory) {
        return new address[](0);
    }

    function isSocialVerified(address, string calldata) external pure override returns (bool) {
        return false;
    }

    function getSocialVerifiedCount(address) external pure override returns (uint256) {
        return 0;
    }

    function getUsersCountOnRegistration(address) external pure override returns (uint256) {
        return 0;
    }

    function init() external override {}

    function register(address, address) external override {}

    function verifyUser(address) external override {}

    function batchSocialVC(SocialVCParams[] calldata) external override {}

    function processBatch(User[] calldata) external override {}
}
