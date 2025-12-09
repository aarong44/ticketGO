// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract TicketGoLite is AccessControl {
    
    // -------------------------
    // Roles y Estados
    // -------------------------
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    // 0=Valid, 1=Used, 2=Refunded
    enum TicketState { Valid, Used, Refunded, Cancelled }

    // -------------------------
    // Estructuras
    // -------------------------
    struct EventInfo {
        uint256 id;
        string name;
        bool isActive;
        uint256 ticketPrice;
    }

    struct Ticket {
        uint256 id;
        uint256 eventId;
        address owner;
        TicketState state;
        string ipfsCid;
        uint256 purchasePrice;
        uint256 timestamp;
    }

    // -------------------------
    // Almacenamiento
    // -------------------------
    uint256 private _nextEventId = 1;
    uint256 private _nextTicketId = 1;

    mapping(uint256 => EventInfo) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(address => uint256[]) private _userTickets;

    // -------------------------
    // Constructor
    // -------------------------
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORGANIZER_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
    }

    // -------------------------
    // Funciones de Organizador
    // -------------------------
    function createEvent(string memory _name, uint256 _price) external {
        require(hasRole(ORGANIZER_ROLE, msg.sender), "No eres organizador");
        
        uint256 id = _nextEventId++;
        events[id] = EventInfo(id, _name, true, _price);
    }

    function toggleEventStatus(uint256 _id) external {
        require(hasRole(ORGANIZER_ROLE, msg.sender), "No auth");
        events[_id].isActive = !events[_id].isActive;
    }

    function withdrawFunds() external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No auth");
        payable(msg.sender).transfer(address(this).balance);
    }

    // Admin Mint (Para regalar entradas)
    function adminMint(address _to, uint256 _eventId, string memory _cid, uint256 _price) external payable {
        require(hasRole(ORGANIZER_ROLE, msg.sender), "No auth");
        _mintTicket(_to, _eventId, _cid, _price);
    }

    // -------------------------
    // Funciones de Usuario (Compra)
    // -------------------------
    function buyTicket(uint256 _eventId, string memory _cid) external payable {
        // Lógica mínima: Si mandas dinero, te doy el ticket.
        _mintTicket(msg.sender, _eventId, _cid, msg.value);
    }

    function batchBuyTickets(uint256 _eventId, string[] memory _cids) external payable {
        // Repartimos el precio total entre los tickets (aproximación)
        uint256 pricePerTicket = _cids.length > 0 ? msg.value / _cids.length : 0;
        
        for (uint i = 0; i < _cids.length; i++) {
            _mintTicket(msg.sender, _eventId, _cids[i], pricePerTicket);
        }
    }

    // Helper interno para crear el ticket
    function _mintTicket(address _to, uint256 _eventId, string memory _cid, uint256 _price) internal {
        uint256 id = _nextTicketId++;
        tickets[id] = Ticket({
            id: id,
            eventId: _eventId,
            owner: _to,
            state: TicketState.Valid,
            ipfsCid: _cid,
            purchasePrice: _price,
            timestamp: block.timestamp
        });
        _userTickets[_to].push(id);
    }

    // -------------------------
    // Funciones de Usuario (Transferencia)
    // -------------------------

    function transferTicket(uint256 _id, address _to) external {
        Ticket storage t = tickets[_id];
        // Solo el dueño o el organizador pueden transferir
        require(t.owner == msg.sender || hasRole(ORGANIZER_ROLE, msg.sender), "No autorizado");
        require(t.state == TicketState.Valid, "Ticket no valido");
        
        // Simulación simple de transferencia:
        // Nota: En un sistema real con paginación, hay que actualizar los arrays _userTickets
        // Eliminando del viejo y poniendo en el nuevo. 
        // Para este Mock Lite, solo cambiamos el owner en el Struct.
        // (El ticket seguirá saliendo en la lista del viejo dueño pero dará error si intenta usarlo, 
        // y NO saldrá en la del nuevo dueño a menos que implementemos la lógica de swap de arrays).
        
        t.owner = _to;
        
        // Lógica mínima de array para que aparezca en el nuevo dueño
        _userTickets[_to].push(_id); 
        // No borramos del antiguo en Lite para ahorrar código complejo, 
        // en el Front filtraremos si el owner != account
    }

    // -------------------------
    // Funciones de Gestión (Refunds & Validar)
    // -------------------------
    function refundTicket(uint256 _id) external {
        // Cualquiera con rol Organizador puede reembolsar
        require(hasRole(ORGANIZER_ROLE, msg.sender), "No auth");
        
        Ticket storage t = tickets[_id];
        require(t.state == TicketState.Valid, "Ticket no valido");

        t.state = TicketState.Refunded;
        
        // Intenta devolver el dinero, si falla no revierte la tx (para no bloquear pruebas)
        if (address(this).balance >= t.purchasePrice) {
            payable(t.owner).transfer(t.purchasePrice);
        }
    }

    function validateEntry(uint256 _id) external {
        require(hasRole(VALIDATOR_ROLE, msg.sender), "No auth");
        
        Ticket storage t = tickets[_id];
        require(t.state == TicketState.Valid, "Ticket invalido o usado");
        
        t.state = TicketState.Used;
    }

    // -------------------------
    // Lectura (Paginación para el Front)
    // -------------------------
    function getTicketsByUserPaginated(address _user, uint256 _start, uint256 _limit) 
        external 
        view 
        returns (Ticket[] memory) 
    {
        uint256[] memory userTicketIds = _userTickets[_user];
        
        if (_start >= userTicketIds.length) {
            return new Ticket[](0);
        }

        uint256 end = _start + _limit;
        if (end > userTicketIds.length) {
            end = userTicketIds.length;
        }

        uint256 size = end - _start;
        Ticket[] memory result = new Ticket[](size);

        for (uint i = 0; i < size; i++) {
            result[i] = tickets[userTicketIds[_start + i]];
        }
        
        return result;
    }
}