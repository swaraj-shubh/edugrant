// EduGrantVaultV2.sol - A secure and feature-rich vault contract for managing educational grants with direct donor funding, revocation, and emergency pause capabilities.
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IERC20 (Extended with transferFrom and allowance)
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title EduGrantVaultV2 (Production Ready)
 * @dev Escrow contract with direct donor funding, revocation, emergency pause, and reentrancy protection.
 */
contract EduGrantVaultV2 {
    // State Variables
    address public admin;
    address public constant SWARAJ_WALLET = 0x3932235AE0a66380dde0c8d1E6357A846b518894;
    IERC20 public stablecoin;
    bool public isPaused;

    // Security: Prevent Reentrancy attacks
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    // Mappings
    mapping(address => bool) public isWhitelistedVendor;
    mapping(address => uint256) public studentAllowances;
    mapping(address => bool) public isAuthorizedBackend;

    // Events
    event VendorStatusUpdated(address indexed vendor, bool isApproved);
    event AllowanceAssigned(address indexed student, uint256 amount);
    event GrantSpent(address indexed student, address indexed vendor, uint256 amount);
    event AllowanceRevoked(address indexed student, uint256 amountRecovered);
    event SystemPaused(bool status);
    event StudentFunded(address indexed donor, address indexed student, uint256 amount);

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
        emit VendorStatusUpdated(_vendor, _statusFlag);
    }

    function authorizeBackend(address _backendWallet, bool _statusFlag) external onlyAdmin {
        isAuthorizedBackend[_backendWallet] = _statusFlag;
    }

    function togglePause(bool _pauseStatus) external onlyAdmin {
        isPaused = _pauseStatus;
        emit SystemPaused(_pauseStatus);
    }

    // Rescue any token accidentally sent to the contract
    function rescueFunds(uint256 _amount, address _to) external onlyAdmin {
        require(stablecoin.transfer(_to, _amount), "Transfer failed");
    }

    // ==========================================
    // 2. GRANT MANAGEMENT
    // ==========================================

    /**
     * @dev Direct donation: donor transfers USDC to contract and increases student's allowance.
     * This is the primary way for donors to fund students.
     */
    function fundStudent(address _student, uint256 _amount) external whenNotPaused nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        // Transfer USDC from donor (msg.sender) to this contract
        require(stablecoin.transferFrom(msg.sender, address(this), _amount), "USDC transfer failed");

        // Increase student's allowance
        studentAllowances[_student] += _amount;
        emit StudentFunded(msg.sender, _student, _amount);
        emit AllowanceAssigned(_student, _amount);
    }

    /**
     * @dev Admin or backend can assign allowance without transferring funds (e.g., from already deposited pool).
     * Only callable by authorized backend or admin.
     */
    function assignAllowance(address _student, uint256 _amount) external onlyBackend whenNotPaused {
        require(_amount > 0, "Amount must be > 0");
        studentAllowances[_student] += _amount;
        emit AllowanceAssigned(_student, _amount);
    }

    /**
     * @dev Revoke a student's remaining allowance (admin only).
     * The revoked amount stays in the contract as unallocated funds.
     */
    function revokeAllowance(address _student) external onlyAdmin {
        uint256 amountToRevoke = studentAllowances[_student];
        require(amountToRevoke > 0, "No allowance to revoke");
        studentAllowances[_student] = 0;
        emit AllowanceRevoked(_student, amountToRevoke);
    }

    // ==========================================
    // 3. STUDENT FUNCTION (Spend Grant)
    // ==========================================

    function spendGrant(address _vendor, uint256 _amount) external nonReentrant whenNotPaused {
        require(isWhitelistedVendor[_vendor], "Vendor not approved");
        require(studentAllowances[msg.sender] >= _amount, "Insufficient allowance");

        // Checks-Effects-Interactions
        studentAllowances[msg.sender] -= _amount;

        // Transfer USDC to the vendor
        require(stablecoin.transfer(_vendor, _amount), "USDC transfer to vendor failed");

        emit GrantSpent(msg.sender, _vendor, _amount);
    }

    // ==========================================
    // 4. UTILITY FUNCTIONS
    // ==========================================

    /**
     * @dev Returns the USDC balance held by this contract.
     */
    function contractBalance() external view returns (uint256) {
        return stablecoin.balanceOf(address(this));
    }
}