pragma solidity 0.5.16;

import "./ERC721Full.sol";
import "tabookey-gasless/contracts/GsnUtils.sol";
import "tabookey-gasless/contracts/IRelayHub.sol";
import "tabookey-gasless/contracts/RelayRecipient.sol";

contract Color is ERC721Full, RelayRecipient {
    struct User {
        string dose1hash;
        string dose2hash;
        bool exists;
    }

    IRelayHub iRelayHub = IRelayHub(0xD216153c06E857cD7f72665E0aF1d7D82172F494);

    string[] public uriList;
    mapping(address => User) public users;
    mapping(string => address) public certificateIdOwner;
    string private defaultString = "";

    constructor() public ERC721Full("CoVac", "VAC") {
        setRelayHub(iRelayHub);
    }

    function acceptRelayedCall(
        address relay,
        address from,
        bytes calldata encodedFunction,
        uint256 transactionFee,
        uint256 gasPrice,
        uint256 gasLimit,
        uint256 nonce,
        bytes calldata approvalData,
        uint256 maxPossibleCharge
    ) external view returns (uint256, bytes memory) {
        return (0, "");
    }

    function preRelayedCall(bytes calldata context) external returns (bytes32) {
        return bytes32(uint256(123456));
    }

    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 actualCharge,
        bytes32 preRetVal /*relayHubOnly*/
    ) external {}

    function mint(
        string memory uri,
        uint256 dose,
        string memory certificateId
    ) public {
        require(dose == 1 || dose == 2);
        require(certificateIdOwner[certificateId] == address(0));

        certificateIdOwner[certificateId] = getSender();

        if (!users[getSender()].exists) {
            User memory user = User(defaultString, defaultString, true);
            users[getSender()] = user;
        }

        User storage user = users[getSender()];

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

        _mint(getSender(), _id);
        _setTokenURI(_id, uri);
    }

    function getUserTokens(address userAddress)
        public
        view
        returns (string memory, string memory)
    {
        if (!users[getSender()].exists) {
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
