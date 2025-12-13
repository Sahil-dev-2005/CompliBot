# OTP Authentication System Design

## Overview

The OTP Authentication System provides secure, passwordless login for the CompliBot dashboard through Telegram-delivered one-time passwords. The system consists of three main components: a React frontend, a Node.js backend API, and a Telegram bot service that work together to authenticate users based on their GSTIN.

## Architecture

The system follows a client-server architecture with the following flow:

1. **Frontend (React)** - Collects user GSTIN and OTP input
2. **Backend API (Express)** - Handles authentication logic and OTP management
3. **Telegram Bot** - Delivers OTP codes to registered users
4. **In-Memory Store** - Temporarily stores OTP codes with expiration

```
Frontend Dashboard ←→ Backend API ←→ Telegram Bot
                           ↓
                      OTP Store (Memory)
```

## Components and Interfaces

### Frontend Components
- **Login Form**: Collects GSTIN input and triggers OTP generation
- **OTP Verification Form**: Collects OTP input and submits for verification
- **API Service**: Handles HTTP requests to backend endpoints

### Backend Components
- **OTP Controller**: Manages OTP generation and verification endpoints
- **OTP Helper**: Provides core OTP generation and validation logic
- **Telegram Bot**: Sends OTP messages to users
- **Database Layer**: Retrieves user information by GSTIN

### API Endpoints
- `POST /api/auth/otp` - Generate and send OTP
- `POST /api/auth/verify` - Verify OTP and authenticate user

## Data Models

### OTP Record
```javascript
{
  gstin: string,        // User's GSTIN identifier
  code: string,         // 6-digit OTP code
  expires: number       // Expiration timestamp
}
```

### API Request/Response Models
```javascript
// OTP Generation Request
{ gstin: string }

// OTP Generation Response
{ success: boolean, message: string }

// OTP Verification Request
{ gstin: string, otp: string }

// OTP Verification Response
{ success: boolean, message: string, user?: object }
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*
### Property Reflection

After reviewing all testable properties from the prework analysis, I identified several areas of redundancy:

- Properties 2.5 and 3.4 both test OTP cleanup after successful use - these can be combined
- Properties 2.4 and 4.3 both test success response format - these can be combined  
- Properties 4.1 and 4.2 can be combined with 4.4 into a comprehensive API response format property
- Properties 3.2 and 3.5 can be combined into a single GSTIN-OTP association property

The following properties provide unique validation value:

Property 1: OTP Format Validation
*For any* valid GSTIN, generating an OTP should produce a 6-digit numeric code
**Validates: Requirements 1.1**

Property 2: OTP Expiration Setting
*For any* generated OTP, the expiration time should be exactly 5 minutes from generation
**Validates: Requirements 1.2**

Property 3: Invalid GSTIN Handling
*For any* invalid or non-existent GSTIN, the system should return an appropriate error response
**Validates: Requirements 1.4**

Property 4: Valid OTP Authentication
*For any* valid OTP submitted within the expiration window, authentication should succeed and return user data
**Validates: Requirements 2.1, 2.4**

Property 5: Expired OTP Rejection
*For any* expired OTP, the system should reject authentication and remove the code from storage
**Validates: Requirements 2.2**

Property 6: Invalid OTP Rejection
*For any* incorrect OTP code, the system should reject authentication
**Validates: Requirements 2.3**

Property 7: OTP Cleanup After Use
*For any* successfully authenticated OTP, the code should be immediately removed from storage
**Validates: Requirements 2.5, 3.4**

Property 8: Cryptographic Randomness
*For any* set of generated OTP codes, they should exhibit statistical randomness properties
**Validates: Requirements 3.1**

Property 9: GSTIN-OTP Association
*For any* GSTIN with multiple OTP requests, only the most recent OTP should remain valid
**Validates: Requirements 3.2, 3.5**

Property 10: Automatic Expiration Cleanup
*For any* expired OTP codes, they should be automatically removed from storage
**Validates: Requirements 3.3**

Property 11: API Response Consistency
*For any* API request, the response should have consistent structure with appropriate HTTP status codes
**Validates: Requirements 4.1, 4.2, 4.4, 4.5**

## Error Handling

The system implements comprehensive error handling across multiple layers:

### Frontend Error Handling
- Network connectivity errors
- Invalid API responses
- User input validation

### Backend Error Handling
- Invalid GSTIN lookup failures
- Telegram API communication errors
- OTP generation and validation errors
- Database connection issues

### Error Response Format
All API errors follow a consistent structure:
```javascript
{
  success: false,
  message: "Descriptive error message"
}
```

## Testing Strategy

The OTP authentication system will use a dual testing approach combining unit tests and property-based tests to ensure comprehensive coverage.

### Unit Testing
Unit tests will verify specific examples and integration points:
- API endpoint behavior with known inputs
- Error handling for specific failure scenarios
- Database integration with mock data
- Telegram bot integration with mock responses

### Property-Based Testing
Property-based tests will verify universal properties using **fast-check** library for JavaScript. Each property-based test will run a minimum of 100 iterations to ensure statistical confidence.

The following correctness properties will be implemented as property-based tests:
- OTP format validation across random valid GSTINs
- Expiration time accuracy for generated OTPs
- Authentication success/failure behavior across random inputs
- Storage cleanup behavior after various operations
- API response consistency across different request types

Each property-based test will be tagged with comments explicitly referencing the design document property using the format: **Feature: otp-authentication, Property {number}: {property_text}**

### Test Configuration
- Property-based tests: minimum 100 iterations per test
- Unit tests: focused on specific examples and edge cases
- Integration tests: end-to-end authentication flow validation
- Error simulation: network failures, invalid inputs, expired tokens