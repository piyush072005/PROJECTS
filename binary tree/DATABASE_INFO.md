# Database Storage Information

## Current Implementation: Browser localStorage

The authentication system currently uses **browser localStorage** to store user data. This is a client-side storage solution that persists data in the user's browser.

### Storage Locations

#### 1. User Data Storage
- **Storage Type**: `localStorage`
- **Key**: `'algo_playground_users'`
- **Location**: Browser's localStorage (persists across browser sessions)
- **Format**: JSON object where email is the key

**Data Structure:**
```javascript
{
  "user@example.com": {
    id: "user_1234567890_abc123",
    name: "John Doe",
    email: "user@example.com",
    password: "hashed_password_string", // Hashed password (NOT plain text)
    createdAt: "2024-01-01T00:00:00.000Z",
    lastLogin: "2024-01-01T12:00:00.000Z",
    history: [
      {
        id: "hist_1234567890_xyz789",
        type: "sort",
        data: { algorithm: "quick", arrayLength: 10, ... },
        timestamp: "2024-01-01T12:00:00.000Z"
      }
      // ... more history entries
    ]
  }
  // ... more users
}
```

#### 2. Session Storage
- **Storage Type**: `localStorage` (if "Remember Me" checked) OR `sessionStorage` (if not checked)
- **Key**: `'algo_playground_session'`
- **Location**: Browser's localStorage or sessionStorage
- **Format**: JSON object

**Session Data Structure:**
```javascript
{
  userId: "user_1234567890_abc123",
  email: "user@example.com",
  name: "John Doe",
  loginTime: "2024-01-01T12:00:00.000Z",
  rememberMe: true
}
```

### How to View Stored Data

#### In Browser Developer Tools:

1. **Open Developer Tools** (F12 or Right-click → Inspect)
2. **Go to Application Tab** (Chrome) or **Storage Tab** (Firefox)
3. **Navigate to Local Storage** → Your domain
4. **Look for these keys:**
   - `algo_playground_users` - Contains all user accounts
   - `algo_playground_session` - Contains current session (if "Remember Me" was checked)

#### Viewing in Console:

```javascript
// View all users
console.log(JSON.parse(localStorage.getItem('algo_playground_users')));

// View current session
console.log(JSON.parse(localStorage.getItem('algo_playground_session')));
// OR
console.log(JSON.parse(sessionStorage.getItem('algo_playground_session')));
```

### Password Storage

**Important Security Note:**
- Passwords are **hashed** before storage (not stored in plain text)
- Current implementation uses a simple hash function (NOT secure for production)
- In production, use proper password hashing (bcrypt, Argon2, etc.)

**Current Hash Function:**
```javascript
hashPassword(password) {
  // Simple hash function (NOT secure for production)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}
```

### Storage Limitations

**localStorage Limits:**
- Maximum storage: ~5-10MB per domain (varies by browser)
- Persists until cleared by user or programmatically
- Shared across all tabs/windows of the same domain
- **NOT encrypted** - accessible via JavaScript

**sessionStorage Limits:**
- Maximum storage: ~5-10MB per domain
- Cleared when browser tab/window closes
- Isolated per tab/window

### Current Code Location

**File**: `scripts/auth.js`

**Key Methods:**
- `getUsers()` - Retrieves all users from localStorage (line 24-32)
- `saveUsers(users)` - Saves users to localStorage (line 35-43)
- `register()` - Creates new user and saves to localStorage (line 46-81)
- `login()` - Validates credentials from localStorage (line 84-106)
- `hashPassword()` - Hashes password before storage (line 257-267)

### Important Notes

⚠️ **This is a client-side only solution:**
- Data is stored locally in the user's browser
- Data is NOT shared across devices
- Data can be cleared by clearing browser data
- NOT suitable for production applications requiring:
  - Cross-device synchronization
  - Server-side validation
  - Secure password storage
  - Multi-user collaboration

### For Production Use

To move to a proper database, you would need:

1. **Backend API** (Node.js, Python, etc.)
2. **Database** (PostgreSQL, MongoDB, MySQL, etc.)
3. **Proper Password Hashing** (bcrypt, Argon2)
4. **Session Management** (JWT tokens, server-side sessions)
5. **API Endpoints** for:
   - User registration
   - User login
   - History storage/retrieval
   - User profile management

### Example Production Setup

```javascript
// Backend API call example
async register(name, email, password) {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return await response.json();
}
```

