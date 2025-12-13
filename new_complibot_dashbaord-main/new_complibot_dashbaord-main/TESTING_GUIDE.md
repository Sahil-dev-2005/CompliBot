# Testing Guide - Complibot Dashboard

## Pre-requisites

1. Backend API must be running at `http://localhost:3000`
2. Frontend application running at `http://localhost:5173`

## Installation & Setup

```bash
cd complibot-dashboard
npm install
npm run dev
```

## Test Cases

### 1. GSTIN Validation Tests

#### Test 1.1: Valid GSTIN Format
- **Input**: `07ABCDE1234F1Z5`
- **Expected**: No error message, "Send OTP" button enabled
- **Status**: ✅ Pass / ❌ Fail

#### Test 1.2: Invalid GSTIN - Too Short
- **Input**: `07ABCDE`
- **Expected**: Error message "GSTIN must be exactly 15 characters"
- **Status**: ✅ Pass / ❌ Fail

#### Test 1.3: Invalid GSTIN - Wrong Format
- **Input**: `ABCDEFGHIJKLMNO`
- **Expected**: Error message "Invalid GSTIN format"
- **Status**: ✅ Pass / ❌ Fail

#### Test 1.4: Character Counter
- **Input**: Type any characters
- **Expected**: Counter shows "X/15 characters" and updates in real-time
- **Status**: ✅ Pass / ❌ Fail

#### Test 1.5: Auto-uppercase Conversion
- **Input**: `07abcde1234f1z5` (lowercase)
- **Expected**: Automatically converts to `07ABCDE1234F1Z5`
- **Status**: ✅ Pass / ❌ Fail

### 2. Send OTP Tests

#### Test 2.1: Send OTP - Success
- **Steps**:
  1. Enter valid GSTIN
  2. Click "Send OTP"
- **Expected**: 
  - Button shows "Sending..." with loading state
  - Button becomes disabled/transparent
  - OTP input field appears
  - GSTIN input becomes disabled
- **Status**: ✅ Pass / ❌ Fail

#### Test 2.2: Send OTP - GSTIN Not Found
- **Steps**:
  1. Enter valid format but non-existent GSTIN
  2. Click "Send OTP"
- **Expected**: 
  - Error message displayed
  - "Send OTP" button re-enabled
  - OTP input does NOT appear
- **Status**: ✅ Pass / ❌ Fail

#### Test 2.3: Send OTP - Network Error
- **Steps**:
  1. Stop backend server
  2. Enter valid GSTIN
  3. Click "Send OTP"
- **Expected**: 
  - Alert: "Server unreachable. Check if backend is running."
  - Button re-enabled
- **Status**: ✅ Pass / ❌ Fail

#### Test 2.4: Button Spam Prevention
- **Steps**:
  1. Enter valid GSTIN
  2. Rapidly click "Send OTP" multiple times
- **Expected**: 
  - Only one API call made
  - Button disabled after first click
- **Status**: ✅ Pass / ❌ Fail

### 3. OTP Verification Tests

#### Test 3.1: OTP Input - Numeric Only
- **Steps**:
  1. After OTP sent, try typing letters in OTP field
- **Expected**: 
  - Only numbers accepted
  - Max 6 digits
- **Status**: ✅ Pass / ❌ Fail

#### Test 3.2: Verify Button - Disabled State
- **Input**: `123` (less than 6 digits)
- **Expected**: "Verify OTP" button disabled
- **Status**: ✅ Pass / ❌ Fail

#### Test 3.3: Verify Button - Enabled State
- **Input**: `123456` (exactly 6 digits)
- **Expected**: "Verify OTP" button enabled
- **Status**: ✅ Pass / ❌ Fail

#### Test 3.4: Verify OTP - Success
- **Steps**:
  1. Enter correct 6-digit OTP
  2. Click "Verify OTP"
- **Expected**: 
  - Redirected to `/dashboard`
  - User data saved in localStorage
- **Status**: ✅ Pass / ❌ Fail

#### Test 3.5: Verify OTP - Invalid OTP
- **Steps**:
  1. Enter incorrect 6-digit OTP
  2. Click "Verify OTP"
- **Expected**: 
  - Error message: "Invalid OTP"
  - OTP field cleared
  - Can retry
- **Status**: ✅ Pass / ❌ Fail

#### Test 3.6: Resend OTP
- **Steps**:
  1. Click "Didn't receive OTP? Resend"
- **Expected**: 
  - New OTP sent
  - Alert: "OTP resent successfully"
  - OTP field cleared
- **Status**: ✅ Pass / ❌ Fail

### 4. Dashboard Tests

#### Test 4.1: Authentication Guard
- **Steps**:
  1. Clear localStorage
  2. Navigate to `/dashboard`
- **Expected**: 
  - Redirected to `/login`
- **Status**: ✅ Pass / ❌ Fail

#### Test 4.2: User Information Display
- **Expected**: 
  - GSTIN displayed correctly
  - Shop name displayed
  - Owner name displayed
- **Status**: ✅ Pass / ❌ Fail

#### Test 4.3: Compliance Gauge
- **Expected**: 
  - Circular gauge shows 7/10
  - Color is green (>70%)
  - Label: "Compliance Score"
- **Status**: ✅ Pass / ❌ Fail

#### Test 4.4: Pending Filings Display
- **Expected**: 
  - 3 pending items shown
  - Overdue items have red badge
  - Pending items have orange badge
  - Days remaining/overdue calculated correctly
  - Amounts displayed where applicable
- **Status**: ✅ Pass / ❌ Fail

#### Test 4.5: Completed Filings Display
- **Expected**: 
  - 3 completed items shown
  - Green checkmark badge
  - ARN numbers displayed
  - Most recent on top
- **Status**: ✅ Pass / ❌ Fail

#### Test 4.6: GST News Feed
- **Expected**: 
  - Shows "Loading news..." initially
  - Displays 3 news items after loading
  - Each item has: title, author, date, summary, "Read More" link
  - Links open in new tab
- **Status**: ✅ Pass / ❌ Fail

#### Test 4.7: GST News Feed - Error Handling
- **Steps**:
  1. Block RSS feed URL in browser
  2. Reload dashboard
- **Expected**: 
  - Message: "Unable to load latest news"
- **Status**: ✅ Pass / ❌ Fail

#### Test 4.8: Logout Functionality
- **Steps**:
  1. Click "Logout" button
- **Expected**: 
  - localStorage cleared
  - Redirected to `/login`
- **Status**: ✅ Pass / ❌ Fail

### 5. Responsive Design Tests

#### Test 5.1: Desktop Layout (>768px)
- **Expected**: 
  - Pending and Completed sections side-by-side
  - News section full width below
  - Gauge inline with user info
- **Status**: ✅ Pass / ❌ Fail

#### Test 5.2: Tablet Layout (768px - 1024px)
- **Expected**: 
  - Pending and Completed sections side-by-side
  - Header may stack
  - All content readable
- **Status**: ✅ Pass / ❌ Fail

#### Test 5.3: Mobile Layout (<768px)
- **Expected**: 
  - All sections stacked vertically
  - Header components stacked
  - Gauge below user info
  - Cards full width
  - Logout button full width
- **Status**: ✅ Pass / ❌ Fail

### 6. UI/UX Tests

#### Test 6.1: No Emojis
- **Expected**: 
  - No emojis anywhere in the UI
- **Status**: ✅ Pass / ❌ Fail

#### Test 6.2: No Gradients
- **Expected**: 
  - Solid colors only, no gradient backgrounds
- **Status**: ✅ Pass / ❌ Fail

#### Test 6.3: Professional Color Scheme
- **Expected**: 
  - Neutral colors (whites, grays, subtle blues)
  - Status colors (green, orange, red) used appropriately
- **Status**: ✅ Pass / ❌ Fail

#### Test 6.4: Loading States
- **Expected**: 
  - Buttons show loading text when processing
  - News section shows "Loading news..."
- **Status**: ✅ Pass / ❌ Fail

#### Test 6.5: Error Messages
- **Expected**: 
  - Clear, user-friendly error messages
  - Red background for errors
  - Dismissible or auto-clear on retry
- **Status**: ✅ Pass / ❌ Fail

### 7. Browser Compatibility Tests

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### 8. Performance Tests

#### Test 8.1: Initial Load Time
- **Expected**: < 3 seconds on good connection
- **Status**: ✅ Pass / ❌ Fail

#### Test 8.2: RSS Feed Load Time
- **Expected**: < 2 seconds
- **Status**: ✅ Pass / ❌ Fail

#### Test 8.3: Navigation Speed
- **Expected**: Instant route changes
- **Status**: ✅ Pass / ❌ Fail

## Test Summary

Total Tests: 38
Passed: ___
Failed: ___
Pass Rate: ___%

## Notes

- Record any bugs or issues found during testing
- Note any browser-specific issues
- Document any performance concerns
- Suggest improvements

## Bug Report Template

```
Bug ID: #___
Title: ___
Severity: Critical / High / Medium / Low
Steps to Reproduce:
1. 
2. 
3. 

Expected Result: ___
Actual Result: ___
Browser: ___
Screenshot: ___
```
