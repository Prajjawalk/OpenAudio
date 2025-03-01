// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVC {
    struct User {
        address userAddr;
        address referrerAddr;
        bool verified;
    }

    struct SocialVCParams {
        address userAddr;
        string social;
        string vc;
    }

    function totalUsers() external view returns (uint256);
    function totalVerifiedUsers() external view returns (uint256);
    function getUser(address user) external view returns (User memory);
    function isVerified(address user) external view returns (bool);
    function isRegistered(address user) external view returns (bool);
    function getReferrersTree(address user) external view returns (address[] memory);
    function isSocialVerified(address user, string memory social) external view returns (bool);
    function getSocialVerifiedCount(address user) external view returns (uint256);
    function getUsersCountOnRegistration(address user) external view returns (uint256);

    function init() external;
    function register(address userAddress, address referrerAddress) external;
    function verifyUser(address user) external;
    function batchSocialVC(SocialVCParams[] calldata params) external;
    function processBatch(User[] calldata users) external;

    event UserRegistered(address userAddress, address referrerAddress);
    event UserVerified(address user);
    event SocialVCVerified(address userAddr, string social, string vc);
    event SocialVCRevoked(address userAddr, string social);
}
