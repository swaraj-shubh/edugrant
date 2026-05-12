// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balance(address account) external view returns (uint256);
}

/**
 * @title EduGrantVault V2 (Production Ready)
 * @dev Escrow contract with Revocation, Emergency Pause, and Reentrancy protection.
 */
contract EduGrantVaultV2 {
    // State Variables
    address public admin;
    address public constant SWARAJ_WALLET = 0x3932235AE0a66380dde0c8d1E6357A846b518894; // my wallet
    IERC20 public stablecoin;
    bool public isPaused; // Emergency stop switch
    
    // Security: Prevent Reentrancy attacks
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    // Mappings
    mapping(address => bool) public isWhitelistedVendor;
    mapping(address => uint256) public studentAllowances;
    mapping(address => bool) public isAuthorizedBackend;

    // Events (UPDATED to match Next.js Dashboard queries perfectly)
    event VendorStatusUpdated(address indexed vendor, bool isApproved);
    event AllowanceAssigned(address indexed student, uint256 amount);
    event GrantSpent(address indexed student, address indexed vendor, uint256 amount);
    event AllowanceRevoked(address indexed student, uint256 amountRecovered);
    event SystemPaused(bool status);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin || msg.sender == SWARAJ_WALLET, "Only Admin can call this");
        _;
    }

    modifier onlyBackend() {
        require(isAuthorizedBackend[msg.sender] || msg.sender == admin, "Only Backend can call this");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "System is currently paused");
        _;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor(address _stablecoinAddress) {
        admin = msg.sender;
        stablecoin = IERC20(_stablecoinAddress);
        _status = _NOT_ENTERED;
        isPaused = false;
    }

    // ==========================================
    // 1. ADMIN & SECURITY FUNCTIONS
    // ==========================================

    function setVendorStatus(address _vendor, bool _statusFlag) external onlyAdmin {
        isWhitelistedVendor[_vendor] = _statusFlag;
        // Updated to match the frontend Dashboard event listener
        emit VendorStatusUpdated(_vendor, _statusFlag);
    }

    function authorizeBackend(address _backendWallet, bool _statusFlag) external onlyAdmin {
        isAuthorizedBackend[_backendWallet] = _statusFlag;
    }

    // Emergency Stop Switch
    function togglePause(bool _pauseStatus) external onlyAdmin {
        isPaused = _pauseStatus;
        emit SystemPaused(_pauseStatus);
    }

    // Rescue unallocated funds (e.g., to return to donors)
    function rescueFunds(uint256 _amount, address _to) external onlyAdmin {
        require(stablecoin.transfer(_to, _amount), "Transfer failed");
    }

    // ==========================================
    // 2. GRANT MANAGEMENT (Backend/Admin)
    // ==========================================

    function assignAllowance(address _student, uint256 _amount) external onlyBackend whenNotPaused {
        studentAllowances[_student] += _amount;
        // Updated to match the frontend Dashboard event listener
        emit AllowanceAssigned(_student, _amount);
    }

    // Revoke funds if a student misbehaves or drops out
    function revokeAllowance(address _student) external onlyAdmin {
        uint256 amountToRevoke = studentAllowances[_student];
        require(amountToRevoke > 0, "No allowance to revoke");
        
        studentAllowances[_student] = 0;
        emit AllowanceRevoked(_student, amountToRevoke);
    }

    // ==========================================
    // 3. STUDENT FUNCTION (The Purchase)
    // ==========================================

    // Added nonReentrant and whenNotPaused for maximum security
    function spendGrant(address _vendor, uint256 _amount) external nonReentrant whenNotPaused {
        require(isWhitelistedVendor[_vendor], "Failed: Vendor is not approved.");
        require(studentAllowances[msg.sender] >= _amount, "Failed: Insufficient allowance.");

        // 1. Deduct balance first (Checks-Effects-Interactions pattern)
        studentAllowances[msg.sender] -= _amount;

        // 2. Transfer crypto
        require(stablecoin.transfer(_vendor, _amount), "Crypto transfer failed");

        emit GrantSpent(msg.sender, _vendor, _amount);
    }
}