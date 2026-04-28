## Plan: MERN Facebook-clone (Backend-first, JavaScript)

TL;DR — A beginner-friendly, step-by-step backend plan using Node.js + Express, MongoDB (Mongoose), Socket.IO for realtime chat/notifications, Cloudinary for media, JWT access + refresh tokens, and Google OAuth. Follow the numbered steps in order; each step lists exact files to create and the API endpoints or socket events you should implement.

**Quick prerequisites (what you should have before starting)**

- Node.js (LTS) installed locally
- A MongoDB Atlas cluster (or local MongoDB) connection string
- Cloudinary account (API key/secret)
- Google OAuth credentials (for social login) — optional but planned
- (Optional) Redis for scaling sockets and queues

---

**Step-by-step Implementation (follow in order)**

Step 0 — Workspace layout (create these folders)

1. Create project root folder `backend/`.
2. Inside `backend/` create these folders: `src/`, `src/models/`, `src/controllers/`, `src/routes/`, `src/middleware/`, `src/config/`, `src/services/`, `src/tests/`.
3. Create `README.md` and `.env.example` in `backend/`.

Step 1 — Install dependencies (list commands for you to run locally)

- Dependencies (runtime):
  - `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors`, `helmet`, `express-rate-limit`, `passport`, `passport-google-oauth20`, `cloudinary`, `multer` (for file parsing on server if needed), `socket.io`, `socket.io-client` (for testing), `dotenv`
- Dev dependencies:
  - `nodemon`, `jest`, `supertest`

Example commands (do not run here; just copy into your terminal when ready):

```bash
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cookie-parser cors helmet express-rate-limit passport passport-google-oauth20 cloudinary multer socket.io dotenv
npm install --save-dev nodemon jest supertest
```

Step 2 — Basic app bootstrap files

- `backend/src/app.js` — create Express app, middleware (helmet, cors, express.json, cookie-parser), rate limiter, error handler placeholder. Export the app.
- `backend/src/server.js` — create HTTP server from `app`, attach Socket.IO, read `PORT` from env, graceful shutdown.
- `backend/.env.example` — list: `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REDIS_URL` (optional).

Step 3 — Configuration helpers

- `backend/src/config/db.js` — Mongoose connection helper; export `connectDB()`.
- `backend/src/config/cloudinary.js` — Cloudinary setup (configure with env vars) and helper to sign uploads or upload from server.
- `backend/src/config/index.js` — centralize env variables and typed defaults.

Step 4 — Mongoose models (create these files)

- `backend/src/models/User.js`
  - Fields: `name`, `email` (unique, indexed), `passwordHash`, `avatarUrl`, `bio`, `friends: [ObjectId]`, `friendRequests: {sent:[], received:[]}`, `googleId`, `refreshTokens: [hashedToken]`, `createdAt`
- `backend/src/models/Post.js`
  - Fields: `author` (ref User), `text`, `media: [{url, type}]`, `likesCount`, `likes: [UserRef]` (optional), `commentsCount`, `visibility` (public/friends), `createdAt`
- `backend/src/models/Comment.js`
  - Fields: `post`(ref), `author`(ref), `text`, `parentComment`(optional ref), `createdAt`
- `backend/src/models/Conversation.js`
  - Fields: `participants: [UserRef]`, `lastMessage`(subdoc), `unreadCounts: Map<UserId, Number>`, `createdAt`
- `backend/src/models/Message.js`
  - Fields: `conversation`(ref), `sender`(ref), `text`, `media: [{url,type}]`, `deliveredAt`, `readAt`, `createdAt`
- `backend/src/models/Notification.js`
  - Fields: `recipient`(ref), `actor`(ref), `type`(string), `payload`(mixed/object), `read`(boolean), `createdAt`

Step 5 — Auth fundamentals (files + goals)

- Files:
  - `backend/src/routes/auth.js`
  - `backend/src/controllers/authController.js`
  - `backend/src/services/jwt.js` — sign/verify access & refresh tokens
  - `backend/src/middleware/auth.js` — Express middleware to verify access token and attach `req.user`
  - `backend/src/config/passport.js` — passport Google strategy (optional)

- Goals & flow:
  1. Signup (`POST /api/auth/signup`): validate input, hash password with `bcryptjs`, create user, return `accessToken` and set refresh token as httpOnly cookie OR return refresh token in body (httpOnly cookie preferred).
  2. Login (`POST /api/auth/login`): validate credentials, issue access token (~15m) + refresh token (longer, e.g., 7d). Store hashed refresh token(s) in user doc to allow rotation / revocation.
  3. Refresh (`POST /api/auth/refresh`): receive refresh token (cookie or body), verify, issue new access token and rotate refresh token.
  4. Logout (`POST /api/auth/logout`): remove refresh token from DB and clear cookie.
  5. Google OAuth routes: `GET /api/auth/google` and `GET /api/auth/google/callback` to allow sign-in/up with Google using Passport.

Step 6 — Media upload (Cloudinary)

- Files:
  - `backend/src/routes/media.js`
  - `backend/src/controllers/mediaController.js`

- Approach (server-signed upload):
  1. Client requests a signature from: `POST /api/media/sign` with intended `folder` and `resource_type`.
  2. Server validates the request (auth) and returns Cloudinary signature and timestamp to the client.
  3. Client uploads directly to Cloudinary using returned signature (safer, offloads server bandwidth).
  4. Store returned `url` / `public_id` in Post or Message document after client notifies server of upload completion.

- Alternative: server-side upload endpoint that accepts multipart/form-data and forwards to Cloudinary. Simpler but uses server bandwidth.

Step 7 — Users & Friendships APIs

- Files:
  - `backend/src/routes/users.js`
  - `backend/src/controllers/userController.js`

- Endpoints (implement each with validation and auth where required):
  - `GET /api/users/:id` — public profile data
  - `PUT /api/users/:id` — update profile (auth: owner)
  - `GET /api/users/search?q=` — search users by name or email (paginated)
  - `POST /api/users/:id/friend-request` — send friend request
  - `POST /api/users/:id/friend-accept` — accept friend request
  - `POST /api/users/:id/friend-remove` — remove friend

Step 8 — Posts, Comments, Likes (core social features)

- Files:
  - `backend/src/routes/posts.js`
  - `backend/src/controllers/postController.js`
  - `backend/src/controllers/commentController.js`

- Endpoints (detailed):
  - `POST /api/posts` — Create a post (auth). Body: `{ text, media: [{ url, type }] , visibility }`.
    - Response: created post object.
  - `GET /api/posts/:id` — Read a single post (includes author, comments count, like count).
  - `DELETE /api/posts/:id` — Delete post (auth: author or moderator).
  - `GET /api/posts/feed?page=&limit=` — User feed. Implementation notes: fetch posts from friends + user, sorted by `createdAt` desc, include pagination and optional `since` cursor.
  - `POST /api/posts/:id/like` — Toggle like for current user; update `likesCount` and optionally `likes` array.
  - `POST /api/posts/:id/comments` — Add comment. Body: `{ text, parentCommentId? }`.
  - `GET /api/posts/:id/comments?page=&limit=` — Paginated comments for a post.

Step 9 — Conversations & Messages (Socket.IO + REST helpers)

- Files:
  - `backend/src/routes/conversations.js`
  - `backend/src/controllers/conversationController.js`
  - `backend/src/services/socket.js` — socket event handlers

- REST endpoints (for bootstrapping and history):
  - `GET /api/conversations` — list conversations for user (include lastMessage and unread counts)
  - `POST /api/conversations` — create conversation (one-to-one or group) — body: `{ participantIds: [] }`
  - `GET /api/conversations/:id/messages?page=&limit=` — paginate historic messages

- Socket events (implement in `src/services/socket.js`):
  - Client→Server:
    - `authenticate` — send `{ token }`; server verifies, stores `socket.userId` and joins a personal room `user:<userId>`.
    - `joinConversation` — params `{ conversationId }` — socket joins room `conversation:<id>`.
    - `leaveConversation` — leave the room.
    - `sendMessage` — params `{ conversationId, text, media? }` — server persists `Message` doc, updates `Conversation.lastMessage`, emits `message` to participants' rooms, and increments unread counts.
    - `typing` — params `{ conversationId, typing: boolean }` — broadcast to room.
    - `markSeen` — params `{ conversationId, messageId }` — update `readAt` and emit `messageSeen` to sender.
  - Server→Client:
    - `message` — new message object
    - `notification` — for likes/comments/friend requests
    - `userOnline` / `userOffline` — presence updates
    - `typing` — typing indicator
    - `messageSeen` — message read receipts

Security note: authenticate sockets by verifying JWT in `authenticate` event or via token in handshake query; reject unauthorized sockets.

Step 10 — Notifications (persistence + socket emission)

- Files:
  - `backend/src/routes/notifications.js`
  - `backend/src/controllers/notificationController.js`

- Endpoints:
  - `GET /api/notifications?page=&limit=` — list notifications for user (most recent first)
  - `POST /api/notifications/mark-read` — body: `{ ids: [] }` or mark all

- Implementation notes:
  - When events happen (new message, like, comment, friend request accepted), create a `Notification` doc and emit `notification` via Socket.IO to `user:<recipientId>`.

Step 11 — Feed & search implementation details

- Feed strategy (simple, beginner-friendly):
  1. For user X, find `friends` list and query `Post` where `author` in `[X, ...friends]` and `visibility` allows.
  2. Apply pagination by `createdAt` with `page` and `limit` or use cursor-based pagination (`createdAt` or `_id`).
- Search endpoints:
  - `GET /api/search/users?q=&page=` — use text index on user name/email.
  - `GET /api/search/posts?q=&page=` — text index on post text.

Step 12 — Tests and Postman collection

- Create basic tests in `backend/src/tests/` using `jest` and `supertest` for these flows:
  1. Auth: signup, login, refresh
  2. Posts: create, read, like, comment
  3. Socket: basic connect + authenticate + message send (use `socket.io-client` in tests or a small node test harness)
- Create a `postman_collection.json` with example requests for all major endpoints.

Step 13 — Logging, validations, and error handling

- Use `express-validator` style checks (or manual validation) in controllers; return consistent error shapes.
- Add request logging middleware (simple console logs for now) in `app.js`.
- Centralize error handler middleware that returns `{ error: true, message, details? }`.

Step 14 — Deployment checklist

- Choose host: Render or Railway recommended (both support WebSockets). Ensure `PORT` env var is used.
- Configure env variables: see `.env.example`.
- If scaling Sockets: add Redis and configure `socket.io-redis` adapter (set `REDIS_URL`).
- CI/CD: add a GitHub Actions workflow to test and deploy (optional later).

---

**Complete API Endpoint Reference (compact, implement each one)**

Auth

- `POST /api/auth/signup` — body `{ name, email, password }` — returns `{ accessToken, user }` and sets refresh cookie or returns refresh token.
- `POST /api/auth/login` — body `{ email, password }` — returns `{ accessToken, user }`.
- `POST /api/auth/refresh` — body/cookie `{ refreshToken }` — returns new `accessToken`.
- `POST /api/auth/logout` — invalidates refresh token.
- `GET /api/auth/google` — start OAuth (frontend redirects)
- `GET /api/auth/google/callback` — OAuth callback.

Users & Friends

- `GET /api/users/:id` — returns profile
- `PUT /api/users/:id` — update profile (auth required)
- `GET /api/users/search?q=&page=&limit=` — search users
- `POST /api/users/:id/friend-request` — send friend request
- `POST /api/users/:id/friend-accept` — accept request
- `POST /api/users/:id/friend-remove` — remove friend

Media

- `POST /api/media/sign` — auth required; returns Cloudinary signature (server-side signed upload)
- `POST /api/media/upload` — optional server endpoint to accept file and upload (multipart)

Posts

- `POST /api/posts` — create post `{ text, media, visibility }`
- `GET /api/posts/:id` — get post
- `DELETE /api/posts/:id` — delete post (owner)
- `GET /api/posts/feed?page=&limit=` — user feed
- `GET /api/posts/user/:userId?page=&limit=` — user timeline
- `POST /api/posts/:id/like` — toggle like

Comments

- `POST /api/posts/:id/comments` — create comment `{ text, parentCommentId? }`
- `GET /api/posts/:id/comments?page=&limit=` — list comments

Conversations & Messages

- `GET /api/conversations` — list convos
- `POST /api/conversations` — create convo `{ participantIds: [] }`
- `GET /api/conversations/:id/messages?page=&limit=` — historic messages

Notifications

- `GET /api/notifications?page=&limit=` — list notifications
- `POST /api/notifications/mark-read` — body `{ ids: [] }` or `{ all: true }`

Admin / Misc (later)

- Moderation endpoints, post reporting, user banning — implement later after MVP.

---

**Socket Event Reference (implement server handlers and client usages)**

- Client→Server
  - `authenticate` { token } — server validates and attaches `socket.userId`.
  - `joinConversation` { conversationId }
  - `leaveConversation` { conversationId }
  - `sendMessage` { conversationId, text, media? }
  - `typing` { conversationId, typing: boolean }
  - `markSeen` { conversationId, messageId }
- Server→Client
  - `message` { message }
  - `notification` { notification }
  - `userOnline` { userId }
  - `userOffline` { userId }
  - `typing` { conversationId, userId, typing }
  - `messageSeen` { messageId, userId }

---

**Security & Best Practices (must do)**

- Hash passwords (`bcryptjs`) and never store plain passwords.
- Use short-lived JWT access tokens and rotate + store refresh tokens securely.
- Use `helmet`, `cors` (restrict origins in production), and `express-rate-limit` for public endpoints.
- Sanitize inputs (to prevent NoSQL injection and XSS in stored content).
- Validate uploaded media types and file sizes; limit video uploads and consider background processing.

---

**Learning & verification checklist (for each major milestone)**

- After auth: verify signup/login/refresh/logout flows; test with Postman.
- After media flow: test signed upload and ensure uploaded URL is usable in posts.
- After posts/comments: create posts with text+image, add comments, like posts; verify DB fields update.
- After sockets: open two browser windows, authenticate sockets, create conversation and send messages; verify messages show in both windows and are persisted.
- After notifications: perform actions that trigger notifications (like/comment), verify the recipient receives socket notifications and sees them in `/api/notifications`.

---

**If you want, next I can (pick one)**

- A: Expand this into a prioritized checklist you can tick off while coding (I will save progress steps to session memory).
- B: Generate file-by-file templates (skeleton files with comments) for you to copy into the workspace (I will remain in plan-only mode and not run anything).
- C: Walk through implementing the auth flow in step-by-step commands and code snippets, with explanations for each line (good for learning).

Tell me which next option you want and I will proceed (I will only plan or generate code templates as you request).

## Detailed Day-by-Day Schedule (Suggested 10-day sprint)

Below is a practical day-by-day breakdown you can follow. Each day lists concrete tasks to complete. Adjust durations where needed.

Day 1 — Project setup

- Initialize repo and create `backend/` folder structure
- Add `.env.example`, `README.md`, and basic Gitignore
- `npm init -y` and install core deps (express, mongoose, dotenv)
- Create `src/app.js` and `src/server.js` skeletons
- Add basic linting / commit hooks (optional)

Day 2 — Database & Models

- Implement `src/config/db.js` and connect to MongoDB
- Create Mongoose models: `User`, `Post`, `Comment`
- Add simple seed script and test DB connection
- Design indexes for user search and post text

Day 3 — Authentication

- Implement signup/login routes and controllers
- Implement JWT access + refresh flow and `auth` middleware
- Add password hashing and refresh-token rotation logic
- Add Google OAuth skeleton (passport) for later
- Write Postman examples for auth flows

Day 4 — Media uploads (images + video prep)

- Configure Cloudinary in `src/config/cloudinary.js`
- Implement `POST /api/media/sign` for signed client uploads
- Add server upload endpoint for fallback (multipart)
- Validate file types/sizes and add upload limits
- Plan video handling: max length, size limits, and preset names

Day 5 — Posts and Feed (text + image)

- Implement `POST /api/posts` and `GET /api/posts/:id`
- Implement `GET /api/posts/feed` (friends + self) with pagination
- Add `POST /api/posts/:id/like` toggle endpoint
- Implement DB shape for media in posts and ensure URLs saved
- Add basic feed response shape for frontend (author, counts, previews)

Day 6 — Reels (short-video feature, separate from feed)

- Decide data model: a `Reel` model or `Post` with type=`reel`
- Implement video upload flow using Cloudinary signed uploads and video presets
- Create `POST /api/reels` (or `POST /api/posts` with type=reel)
- Create `GET /api/reels/feed` — separate endpoint returning vertical, short-form items
- Add thumbnail generation (Cloudinary transformation) and duration metadata
- Implement simple client-side playback guidance (autoplay, mute, loop)

Day 7 — Comments, Likes, Notifications

- Implement `POST /api/posts/:id/comments` and `GET /api/posts/:id/comments`
- Ensure likes/comments update `Post` counters atomically
- Create `Notification` model + `POST /api/notifications/mark-read`
- Emit notifications via Socket.IO when actions happen

Day 8 — Conversations & Real-time (Socket.IO)

- Bootstrap Socket.IO in `src/server.js` and add auth for sockets
- Implement events: `authenticate`, `sendMessage`, `joinConversation`, `typing`, `markSeen`
- Create `Conversation` + `Message` models and REST history endpoints
- Test realtime messaging across two clients (or use socket.io-client test harness)

Day 9 — Frontend skeleton & Upload UI

- Scaffold a minimal React app (or Next.js) with pages: Feed, Reels, Upload
- Implement Reels player & infinite vertical scroll on Reels page
- Implement feed page with infinite scroll and post composer (image + video links)
- Use the media signing endpoint for direct uploads to Cloudinary

Day 10 — Tests, CI, Deployment, Polish

- Write critical tests: auth, create post, feed endpoint, reels upload flow
- Create Postman collection for endpoints used by frontend
- Create a basic GitHub Action to run tests and lint
- Prepare deployment checklist (env vars, Redis for scaling sockets)
- Minor polish: error shapes, request validation, logging

Decision notes: Reels vs Feed

- Reels are best implemented as either a separate `Reel` model or `Post.type = 'reel'`.
- Provide a separate endpoint `GET /api/reels/feed` optimized for short-video metadata (thumbnails, duration, preview URLs).
- Keep feed (`GET /api/posts/feed`) focused on text/image posts and long-form video.
- For MVP, reuse the same upload path but tag media items with `type: 'reel'` and treat them specially in the feed layer.

What I recommend

- Start backend-first (Days 1–6) to get uploads and auth working before building the client.
- Implement Reels as `Post` with `type: 'reel'` for faster development and later split if scaling needs arise.

If you want, I can now:

- A: Adjust durations and break days into half-days
- B: Generate skeleton files for one day (pick which day)
- C: Create frontend upload UI templates for Reels and Feed

I've saved this as a 10-day TODO; tell me which next action you want.
