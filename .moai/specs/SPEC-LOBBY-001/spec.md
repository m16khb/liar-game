# SPEC-LOBBY-001: Game Lobby System

## Overview
The game lobby system provides a centralized interface for players to discover, create, and join game rooms before starting a Liar Game session. It serves as the entry point for all multiplayer interactions, handling room management, player authentication, and pre-game coordination.

## Requirements (EARS Format)

### Ubiquitous Requirements
- The system SHALL display a list of available game rooms to all users (authenticated and non-authenticated)
- The system SHALL require user authentication for room creation and joining
- The system SHALL generate unique room codes for each created room
- The system SHALL validate room configuration parameters (min/max players, title length, etc.)
- The system SHALL maintain real-time updates of room status and player counts
- The system SHALL support both public and private room visibility
- The system SHALL provide responsive design for mobile, tablet, and desktop devices

### Event-Driven Requirements

**Room Creation Flow:**
- WHEN authenticated user clicks "Create Room" → System SHALL display room creation modal
- WHEN user submits valid room configuration → System SHALL create room with unique code
- WHEN room is successfully created → System SHALL redirect host to the game room
- WHEN room creation fails validation → System SHALL display appropriate error messages

**Room Discovery Flow:**
- WHEN user accesses lobby → System SHALL fetch and display waiting rooms
- WHEN user searches for rooms → System SHALL filter rooms by title keyword
- WHEN user refreshes room list → System SHALL fetch latest room data

**Room Joining Flow:**
- WHEN user clicks "Join" on a room → System SHALL verify authentication status
- WHEN room is at full capacity → System SHALL disable join button and show "정원 초과"
- WHEN user successfully joins → System SHALL redirect to game room
- WHEN user joins by code → System SHALL validate code exists and room is waiting

**Authentication Flow:**
- WHEN non-authenticated user attempts to join/create room → System SHALL redirect to login
- WHEN user completes login → System SHALL redirect to originally requested action

### Unwanted Requirements

**Input Validation:**
- IF room title is empty or exceeds 100 characters → System SHALL reject creation
- IF minimum players > maximum players → System SHALL reject creation
- IF private room has no password → System SHALL reject creation
- IF room code is invalid or doesn't exist → System SHALL show "존재하지 않는 방"
- IF room status is not 'waiting' → System SHALL prevent joining
- IF search keyword is less than 2 characters → System SHALL reject search

**State Management:**
- IF room becomes full → System SHALL update UI to show full capacity
- IF room status changes to 'playing' → System SHALL remove from waiting list
- IF network error occurs → System SHALL display error message and retry option

### State-Driven Requirements

**Room States:**
- WHILE room is in 'waiting' state → System SHALL display in lobby list
- WHILE room is in 'playing' state → System SHALL hide from lobby list
- WHILE room is in 'finished' state → System SHALL hide from lobby list

**Authentication States:**
- WHILE user is authenticated → System SHALL enable room creation and joining
- WHILE user is not authenticated → System SHALL show login prompts for actions

### Optional Requirements

**Private Room Features:**
- WHERE room is marked as private → System SHALL require password for access
- WHERE password is provided → System SHALL validate before allowing entry

**Advanced Features:**
- WHERE user provides description → System SHALL display in room details
- WHERE time limit is set → System SHALL display in room information
- WHERE game settings are configured → System SHALL store as JSON metadata

## Data Models

### Room Entity
```typescript
interface Room {
  id: number                    // Primary key
  code: string                  // Unique room identifier (32 chars)
  title: string                 // Room display name (max 100 chars)
  status: RoomStatus           // waiting | playing | finished
  difficulty: GameDifficulty   // easy | normal | hard
  minPlayers: number           // Minimum players to start (default: 4)
  maxPlayers: number           // Maximum players allowed (default: 8)
  currentPlayers: number       // Current player count
  isPrivate: boolean           // Room visibility flag
  password?: string            // Private room password (nullable)
  timeLimit?: number           // Game time limit in seconds (optional)
  gameSettings?: Record<string, any>  // Additional game configuration
  description?: string         // Room description (optional)
  hostId?: number              // Room host identifier
  host?: User                  // Host user information
  createdAt: Date              // Creation timestamp
  updatedAt: Date              // Last update timestamp
  deletedAt?: Date             // Soft delete timestamp
}
```

### Create Room Request
```typescript
interface CreateRoomRequest {
  title: string                 // Required: Room title
  minPlayers: number           // Required: Minimum players (4-8)
  maxPlayers: number           // Required: Maximum players (4-8)
  difficulty: GameDifficulty   // Required: Game difficulty
  isPrivate: boolean           // Required: Privacy setting
  password?: string            // Required if isPrivate=true
  description?: string         // Optional: Room description
  timeLimit?: number           // Optional: Time limit in seconds
}
```

### Room Response DTO
```typescript
interface RoomResponse {
  id: number
  code: string
  title: string
  status: RoomStatus
  difficulty: GameDifficulty
  minPlayers: number
  maxPlayers: number
  currentPlayers: number
  isPrivate: boolean
  timeLimit?: number
  description?: string
  gameSettings?: Record<string, any>
  host?: {
    id: number
    nickname: string
    avatar?: string
  }
  createdAt: Date
  updatedAt: Date
}
```

## API Endpoints

### GET /api/rooms
- **Description**: Retrieve list of available rooms
- **Authentication**: Not required
- **Query Parameters**:
  - `status?: RoomStatus` - Filter by room status
- **Response**: Array of RoomResponse objects
- **Security**: Rate limiting removed for public access

### GET /api/rooms/search
- **Description**: Search rooms by title keyword
- **Authentication**: Not required
- **Query Parameters**:
  - `q: string` - Search keyword (min 2 characters)
- **Response**: Array of RoomResponse objects
- **Validation**: Keyword must be at least 2 characters
- **Security**: XSS filtering applied to search keyword

### GET /api/rooms/:code
- **Description**: Retrieve specific room by code
- **Authentication**: Not required
- **Path Parameters**:
  - `code: string` - Room code (32 characters)
- **Response**: Single RoomResponse object
- **Error**: 404 if room not found
- **Security**: Room code format validation

### POST /api/rooms
- **Description**: Create a new room
- **Authentication**: Required (JWT Bearer Token)
- **Request Body**: CreateRoomRequest
- **Response**: Created RoomResponse object
- **Validations**:
  - User must have USER or ADMIN role
  - Title must be 1-100 characters (XSS filtered)
  - Min players must be <= max players
  - Private rooms must have password (4-20 characters)
- **Security**: Input sanitization applied to all fields

### POST /api/rooms/:code/join
- **Description**: Join a room using room code
- **Authentication**: Required (JWT Bearer Token)
- **Path Parameters**:
  - `code: string` - Room code (32 characters)
- **Request Body**: `{ password?: string }` - Required for private rooms
- **Response**: Updated RoomResponse object
- **Validations**:
  - User must have USER or ADMIN role
  - Room must be in 'waiting' status
  - Room must not be at full capacity
  - Password validation for private rooms
- **Security**: Room code format validation, password strength checking

## UI Components

### RoomList Component
- **Purpose**: Main lobby interface displaying available rooms
- **Features**:
  - Responsive grid layout (mobile/tablet/desktop)
  - Real-time room count display
  - Room filtering by status
  - Join room functionality
  - Create room button
  - Code join button
  - User authentication status
  - Error handling and display

### CreateRoomModal Component
- **Purpose**: Modal interface for room creation
- **Form Fields**:
  - Room title (required, max 100 chars)
  - Player count settings (min/max: 4-8)
  - Difficulty selection (easy/normal/hard)
  - Private room toggle
  - Password field (conditional for private rooms)
  - Description (optional, max 500 chars)
- **Validations**:
  - Client-side validation before submission
  - Real-time error display
  - Loading states during creation

### JoinRoomByCode Component
- **Purpose**: Modal for joining rooms via code
- **Form Fields**:
  - Room code input (auto-uppercase, 32 characters)
  - Password field (required for private rooms)
- **Validations**:
  - Room code format validation
  - Password strength validation for private rooms
  - Real-time error display
- **Features**:
  - Room code format checking (32-character UUID)
  - Password input with masking
  - Error handling for invalid codes/passwords
  - Redirect after successful join

## Security Considerations

### Authentication & Authorization
- Room creation and joining require JWT authentication
- User roles: USER, ADMIN can create and join rooms
- Public access for room viewing (GET endpoints)
- Protected access for room operations (POST endpoints)
- Comprehensive logging for security events

### Enhanced Input Validation
- Server-side validation for all inputs using class-validator
- SQL injection prevention via TypeORM
- Comprehensive XSS filtering via SanitizeUtil
- Password strength validation for private rooms
- Room code format validation (32-character UUID)

### Security Filtering Implementation
```typescript
// XSS and SQL Injection prevention
static sanitizeHtml(input: string): string
static sanitizeSql(input: string): string

// Room-specific sanitization
static sanitizeRoomTitle(title: string): string
static sanitizeRoomDescription(description: string): string
static sanitizeSearchKeyword(keyword: string): string

// Validation methods
static validatePasswordStrength(password: string): validation result
static validatePlayerCount(min: number, max: number): validation result
static validateGameSettings(settings: object): validation result
```

### Privacy Controls
- Private rooms excluded from public listings
- Password protection with strength requirements
- Room code obfuscation (32-character UUID)
- Soft delete implementation for data integrity
- Security exception filter for error handling

### Security Exception Filter
- Global exception handling with SecurityExceptionFilter
- Security event logging and monitoring
- Request ID tracking for debugging
- Environment-specific error message masking

## Performance Requirements

### Response Times
- Room list loading: < 500ms
- Room creation: < 1000ms
- Room search: < 300ms
- Room detail retrieval: < 200ms

### Scalability
- Support 1000+ concurrent rooms
- Handle 100+ room creations per minute
- Efficient database queries with proper indexing
- Soft delete implementation for data integrity

## Error Handling

### Client Errors (4xx)
- 400: Bad Request - Invalid input parameters
- 401: Unauthorized - Authentication required
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Room doesn't exist

### Server Errors (5xx)
- 500: Internal Server Error - Unexpected failures
- Graceful degradation with retry options
- User-friendly error messages
- Logging for debugging

## Technical Implementation Details

### Database Schema
- PostgreSQL with TypeORM
- Indexed columns: code (unique), status + createdAt
- Soft delete implementation
- Foreign key relationships to users table

### Frontend Architecture
- React with TypeScript
- Custom hooks for state management (useRooms, useAuth)
- Responsive CSS-in-JS styling
- WebSocket integration for real-time updates

### Backend Architecture
- NestJS framework
- RESTful API design
- DTO validation with class-validator
- JWT authentication middleware (@UseGuards)
- Comprehensive logging (NestJS Logger)
- Global exception handling (SecurityExceptionFilter)
- Input sanitization utilities (SanitizeUtil)

### Security Enhancements
- **Input Sanitization**: XSS and SQL Injection filtering
- **Role-Based Access Control**: USER/ADMIN roles
- **Password Strength Validation**: Minimum 4 characters, XSS filtering
- **Room Code Validation**: 32-character UUID format
- **Rate Limiting Removal**: Simplified public access
- **Security Logging**: Comprehensive security event tracking

## Testing Requirements

### Unit Tests
- Room service methods: 90% coverage
- Controller endpoints: All success/error paths
- Security validation: XSS/SQL filtering tests
- Input sanitization: All sanitize methods
- Password validation: Strength and format tests
- Component rendering: All UI states
- Form validation: All rules

### Integration Tests
- API endpoint flows: Create → List → Join
- Database operations: CRUD operations with soft delete
- Authentication flows: Login → Action
- Security exception handling: Error responses
- Join endpoint validation: Code and password tests

### Security Testing
- XSS injection prevention: Malicious script filtering
- SQL injection prevention: Query pattern filtering
- Password strength testing: Minimum requirements
- Room code format validation: UUID structure
- Authentication bypass attempts: Role-based access
- Input validation bypass: Edge case testing

### E2E Tests
- Complete user journeys: Login → Create → Join
- Mobile responsiveness: All viewports
- Error scenarios: Network failures, invalid inputs

## Future Enhancements

### V2 Features
- Room categories/tags
- Spectator mode
- Room templates
- Quick join functionality
- Friend system integration
- Room history/recent rooms

### Performance Optimizations
- WebSocket real-time updates
- Room caching strategy
- CDN for static assets
- Database query optimization

## Success Metrics

### User Engagement
- Room creation rate: Target 50 rooms/day
- Join success rate: > 95%
- Time to first game: < 3 minutes

### Technical Metrics
- API response time: < 500ms (95th percentile)
- Error rate: < 1%
- Concurrent users: Support 1000+

### Business Metrics
- User retention: 70% return within 7 days
- Session duration: Average 20 minutes
- Conversion: Guest → Registered user: 30%