# Chat Application - AI Coding Agent Instructions

## Project Overview
A Next.js 16 financial tracking and chat application built with Firebase backend, React 19, and Tailwind CSS. Targets real-time data sync with responsive UI supporting dark mode.

## Architecture

### Core Technology Stack
- **Framework**: Next.js 16 with App Router, React 19 with React Compiler enabled
- **Styling**: Tailwind CSS 4 with PostCSS
- **Backend**: Firebase (Auth, Realtime Database, Storage)
- **State Management**: React Context API (AuthContext, ThemeContext)
- **Rendering**: Client components with dynamic imports for hydration safety

### Key Components
- **`src/context/AuthContext.js`**: Manages Firebase auth state with SSR-safe hydration (mounted flag prevents mismatches)
- **`src/context/ThemeContext.js`**: Dark/light theme toggle persisted to localStorage
- **`src/lib/firebase.js`**: Centralized Firebase SDK initialization with emulator support (commented for production)
- **`src/app/dashboard/wrapper.jsx`**: Dynamic import wrapper for dashboard to prevent SSR hydration issues
- **`src/components/dashboard-content.jsx`**: Main dashboard with personal/group chat tabs, group creation/joining
- **`src/components/financial-tracker.jsx`**: Real-time transaction tracking using Firebase Realtime Database
- **`src/components/group-chat.jsx`**: Group messaging interface with member list and permissions
- **`src/components/create-group-modal.jsx`**: Modal for creating public/private groups with password protection
- **`src/components/join-group-modal.jsx`**: Modal for joining existing groups with password validation

### Data Flow
1. Root layout wraps with `Providers` (ThemeProvider → AuthProvider)
2. Firebase auth state triggers via `onAuthStateChanged` listener in AuthContext
3. Components use `useAuth()` and `useTheme()` hooks for context access
4. Protected route `/dashboard` loads DashboardContent dynamically to avoid hydration mismatches
5. DashboardContent shows tabbed interface: Personal Chat (1:1 messaging) or Groups (group messaging)
6. Personal chat syncs from `messages/{chatId}` (generated from sorted user UIDs)
7. Group chat syncs from `groups/{groupId}/messages` path
8. Group list and membership tracked in `groups/{groupId}/members`

## Developer Workflows

### Setup & Running
```powershell
npm install
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build
npm run start        # Run production server
npm run lint         # Run ESLint (next/core-web-vitals)
npm run setup-cors   # Configure Firebase Storage CORS (Windows PowerShell)
bash setup-cors.sh   # Configure CORS (macOS/Linux)
```

### Firebase Configuration
- **Environment Variables**: All Firebase config stored as `NEXT_PUBLIC_*` in `.env.local`
- **Realtime DB**: Optional initialization - warns if `NEXT_PUBLIC_FIREBASE_DATABASE_URL` missing
- **Storage**: Requires CORS setup for local development uploads (see `CORS_QUICK_FIX.md`)
- **Emulator**: Disabled by default; uncomment in `firebase.js` to enable local Firebase emulator on ports 9099 (Auth), 9000 (DB)

### Middleware & Routing
- **`middleware.ts`**: Basic route matcher for protected (`/dashboard`) and public routes (`/login`, `/register`) - currently logs routes but doesn't enforce auth (auth protection is client-side)
- **Root redirect**: `/` redirects to `/login` via `src/app/page.js`

## Project-Specific Patterns

### Hydration Safety
- All client components use `"use client"` directive
- Contexts implement `mounted` state to prevent SSR/client mismatch on initial render
- Dynamic imports with `ssr: false` for components needing browser APIs (see dashboard wrapper)

### Firebase Listeners
- Real-time data syncing uses `onValue()` listener pattern with cleanup via unsubscribe
- Data is mapped from Firebase snapshot objects to arrays with ID extraction
- Example: `users/{uid}/transactions` → sorted array of transaction objects

### Number Formatting
- FinancialTracker uses regex-based formatting: `num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")`
- Applied on input changes to maintain user-friendly display while storing raw values

### Styling Approach
- Tailwind CSS 4 with CSS modules for component-scoped styles
- `financial-tracker.module.css` demonstrates CSS Modules usage alongside Tailwind
- `globals.css` contains root styles (imported in layout)
- Dark mode toggle via `document.documentElement.classList.toggle("dark", isDark)`

## Critical Integration Points

### Authentication Flow
1. `AuthProvider` initializes `onAuthStateChanged` listener on mount
2. Sets `loading: true` until Firebase returns auth state
3. Components check `user` from `useAuth()` to render conditional UI
4. Middleware doesn't block routes - client-side auth checks required

### Real-Time Database Writes
- Example pattern in FinancialTracker:
  ```javascript
  const transactionsRef = ref(db, `users/${user.uid}/transactions`);
  push(transactionsRef, transactionData);  // Add new
  remove(ref(db, `users/${user.uid}/transactions/${id}`));  // Delete
  ```

### Online/Offline Status System
- User status tracked in `status/{uid}` path with array of status objects
- Status updates when user mounts (online) and on page unload (offline)
- Latest status retrieved in components via `userStatuses` state synced with listener
- Display status with green (🟢 online) or gray (🔴 offline) indicators in user list and chat header

### Auto-Scroll to Latest Messages
- Messages container uses `ref` (`messagesEndRef`) pointing to empty div after last message
- useEffect triggers on messages array change: `messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })`
- Automatically scrolls to latest message when new messages arrive or user selects chat

### Group Chat Architecture
**Types**: Public (anyone can join) or Private (requires password)
**Database Structure**:
```
groups/{groupId}/
  ├── name: string
  ├── type: "public" | "private"
  ├── password: string (only for private groups)
  ├── createdBy: uid
  ├── createdAt: timestamp
  ├── members/{uid}/
  │   ├── username: string
  │   ├── email: string
  │   ├── joinedAt: timestamp
  │   └── role: "admin" | "member"
  └── messages/{messageId}/
      ├── text: string
      ├── senderId: uid
      ├── senderName: string
      └── timestamp: number
```

**Workflow**:
1. User clicks "Create" → Opens CreateGroupModal with group name, type, optional password
2. On creation: Admin automatically added as member, group stored in `groups/{id}`
3. User clicks "Join" → Opens JoinGroupModal showing available groups
4. If private: Validates password before adding as member
5. Selecting group shows GroupChat component with messages, members sidebar
6. Admin can delete group; members can leave
7. Real-time messages synced with `onValue()` listener on `groups/{groupId}/messages`

### CORS Configuration
- Local dev requires Firebase Storage CORS setup via `cors.json`
- Run `npm run setup-cors` (PowerShell) or `bash setup-cors.sh` to apply
- Fallback: Configure manually in Firebase Console under Storage > CORS tab

## ESLint & Code Quality
- Config: `eslint.config.mjs` (new ESLint flat config format)
- Extends `eslint-config-next/core-web-vitals`
- Run `npm run lint` before commits

## Common Tasks

### Adding a New Firebase Collection
1. Add listener in appropriate component/context similar to `financial-tracker.jsx` pattern
2. Use `ref(db, `users/{uid}/collectionName`)` path structure
3. Implement cleanup in useEffect return statement
4. Add loading/error states following AuthContext pattern

### Adding a New Route
1. Create folder in `src/app/` following Next.js App Router conventions
2. Add `page.js` or `page.jsx` (use JSX for interactive components)
3. Mark with `"use client"` if using hooks/interactivity
4. Use dynamic imports for hydration-sensitive components
5. Update middleware.ts if route should be protected/public

### Modifying Themes
- Update ThemeContext logic for theme variables
- Persist changes to localStorage (already implemented)
- Update `globals.css` for dark mode class selectors (`.dark`)

## Known Issues & Solutions
- **Hydration Mismatch**: Use `mounted` state in contexts; use dynamic imports with `ssr: false`
- **Firebase DB Not Initialized**: Check `.env.local` has `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- **CORS Upload Errors**: Run `npm run setup-cors` and verify Firebase project ID in environment
- **Emulator Port Conflicts**: Change ports in firebase.js `connectAuthEmulator()` and `connectDatabaseEmulator()` calls
- **Create Group Not Working**: Ensure `firebase.js` initializes only on client (`typeof window !== "undefined"`) to prevent SSR errors. All Firebase calls must be from `"use client"` components.
- **Firebase Operations Fail**: Check browser console for errors. Firebase requires valid credentials in `.env.local` with all `NEXT_PUBLIC_FIREBASE_*` variables populated.
