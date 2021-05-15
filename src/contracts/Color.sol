pragma solidity 0.5.16;

import "./ERC721Full.sol";

contract Color is ERC721Full {
    struct User {
        string dose1hash;
        string dose2hash;
        bool exists;
    }

    string[] public uriList;
    mapping(address => User) public users;
    mapping(string => address) public certificateIdOwner;
    string private defaultString = "";

    constructor() public ERC721Full("CoVac", "VAC") {}

    function mint(
        string memory uri,
        uint256 dose,
        string memory certificateId
    ) public {
        require(dose == 1 || dose == 2);
        require(certificateIdOwner[certificateId] == address(0));

        certificateIdOwner[certificateId] = msg.sender;

        if (!users[msg.sender].exists) {
            User memory user = User(defaultString, defaultString, true);
            users[msg.sender] = user;
        }

        User storage user = users[msg.sender];

        if (dose == 1) {
            require(
                keccak256(abi.encodePacked(user.dose1hash)) ==
                    keccak256(abi.encodePacked(defaultString))
            );
            user.dose1hash = uri;
        }

        if (dose == 2) {
            require(
                keccak256(abi.encodePacked(user.dose2hash)) ==
                    keccak256(abi.encodePacked(defaultString))
            );
            user.dose2hash = uri;
        }

        uint256 _id = uriList.push(uri);

        _mint(msg.sender, _id);
        _setTokenURI(_id, uri);
    }

    function getUserTokens(address userAddress)
        public
        view
        returns (string memory, string memory)
    {
        if (!users[msg.sender].exists) {
            return ("", "");
        }

        return (users[userAddress].dose1hash, users[userAddress].dose2hash);
    }

    function getLatestTokens()
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            string memory
        )
    {
        uint256 l = uriList.length - 1;
        return (
            uriList[l - 1],
            uriList[l - 2],
            uriList[l - 3],
            uriList[l - 4],
            uriList[l - 5],
            uriList[l - 6]
        );
    }
}
