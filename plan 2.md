Project Plan — MERN Social App (Detailed 10-day merged plan)

Goal

- Build a Facebook/TikTok-style social app with: auth (JWT + refresh), posts (text/image/video), reels (short video), feed, comments/likes, notifications, conversations (Socket.IO), and Cloudinary for media.
- Backend-first approach: build APIs + uploads, then frontend integration.

Quick prerequisites (exact versions recommended)

- Node.js 18+ (use `nvm` to pin: `nvm install 18 && nvm use 18`)
- MongoDB Atlas or local MongoDB 6+
- Cloudinary account (cloud name, API key, API secret)
- (Optional) Redis for production socket scaling
- GitHub account (for repo + CI)

Repository layout (what we'll create)

- `/backend/`
  - `package.json`, `.env.example`, `README.md`
  - `src/`
    - `app.js`, `server.js`
    - `config/` (db.js, cloudinary.js, index.js)
    - `models/` (User.js, Post.js, Comment.js, Conversation.js, Message.js, Notification.js, Reel.js optional)
    - `controllers/` (authController.js, postController.js, mediaController.js, userController.js, conversationController.js, notificationController.js)
    - `routes/` (auth.js, users.js, posts.js, media.js, conversations.js, notifications.js, reels.js)
    - `middleware/` (auth.js, errorHandler.js, validate.js)
    - `services/` (jwt.js, socket.js)
    - `tests/` (jest + supertest)

Global decisions (MVP choices)

- Reuse `Post` model with `type: 'post' | 'reel'` for faster MVP.
- Media: signed direct uploads to Cloudinary; server issues signature.
- Auth: short-lived access tokens (~15m) + refresh tokens (7d) rotated and hashed in DB.
- Feed: friends + self posts; `GET /api/posts/feed` (cursor-based pagination by createdAt).
- Reels feed: `GET /api/reels/feed` returning only posts with `type: 'reel'` and video metadata.

Common npm packages we will use (exact install commands)

- Runtime:
  - express, mongoose, bcryptjs, jsonwebtoken, cookie-parser, cors, helmet, express-rate-limit, passport, passport-google-oauth20, cloudinary, multer, socket.io, dotenv
- Dev:
  - nodemon, jest, supertest, eslint, prettier

Day 0 — (prep, run before Day 1)

- Create a GitHub repo and clone locally.
- Create a top-level `.gitignore` with `node_modules`, `.env`, `dist`, `build`.
- Create a root `plan.md` and this `plan 2.md` (done).

Commands to run initially (copy/paste)

```bash
# in backend/
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cookie-parser cors helmet express-rate-limit passport passport-google-oauth20 cloudinary multer socket.io dotenv
npm install --save-dev nodemon jest supertest eslint prettier
```

Day 1 — Project setup (exact tiny steps)

1. Create folder structure:
   - `mkdir -p backend/src/{config,models,controllers,routes,middleware,services,tests}`
2. Initialize npm and install deps (see commands above).
3. Create `backend/.env.example` with keys:
   - PORT=5000
   - MONGO_URI=
   - JWT_SECRET=
   - JWT_REFRESH_SECRET=
   - CLOUDINARY_CLOUD_NAME=
   - CLOUDINARY_API_KEY=
   - CLOUDINARY_API_SECRET=
   - GOOGLE_CLIENT_ID=
   - GOOGLE_CLIENT_SECRET=
   - REDIS_URL=
4. Add `backend/src/app.js` skeleton (express + middleware):
   - require('express'), helmet, cors, express.json(), cookieParser
   - basic rate limiter
   - mount `/api` router placeholder
   - export app
5. Add `backend/src/server.js`:
   - load dotenv, connectDB(), import app, create http server, attach Socket.IO, start server on `process.env.PORT || 5000`
   - add graceful shutdown handlers for SIGINT/SIGTERM
6. Create `README.md` stub in `backend/` with run commands:
   - `npm run dev` -> `nodemon src/server.js`
7. Setup `package.json` scripts:
   - `dev`: `nodemon src/server.js`
   - `start`: `node src/server.js`
8. Commit: `git add . && git commit -m "bootstrap backend structure"`

Day 2 — DB & Models (exact tiny steps)

1. Implement `backend/src/config/db.js`:
   - export `connectDB()` using `mongoose.connect(process.env.MONGO_URI)` with retry logging
2. Create models with field-level details:
   - `User.js`: name, email (unique,index), passwordHash, avatarUrl, bio, friends: [ObjectId], friendRequests: { sent:[], received:[] }, googleId, refreshTokens: [hashedToken], createdAt
   - `Post.js`: author ref, text, media [{ url, type, public_id, duration?, width, height }], likesCount, commentsCount, type: enum('post','reel'), visibility, createdAt
   - `Comment.js`: post ref, author ref, text, parentComment ref (optional), createdAt
   - `Conversation.js`: participants [UserRef], lastMessage subdoc, unreadCounts map, createdAt
   - `Message.js`: conversation ref, sender ref, text, media[], deliveredAt, readAt, createdAt
   - `Notification.js`: recipient ref, actor ref, type, payload(object), read boolean, createdAt
3. Add text indexes where useful:
   - `User` name/email text index (or use compound index for search)
   - `Post` text index for post search
4. Create a `seed.js` script to create a test user and a couple sample posts. Run it once to validate DB connection.

Day 3 — Authentication (exact tiny steps)

1. Files to create:
   - `routes/auth.js`, `controllers/authController.js`, `services/jwt.js`, `middleware/auth.js`, `config/passport.js`
2. Implement signup flow:
   - Validate `name,email,password` (min password length 8)
   - Hash password with `bcryptjs` (saltRounds=10)
   - Save user and return `accessToken` + set `refreshToken` as `httpOnly` cookie
3. Implement login flow:
   - Verify password, issue access + refresh tokens
   - Save hashed refresh token in user.refreshTokens array (for rotation)
4. Implement `POST /api/auth/refresh`:
   - Read refresh token from cookie, verify, rotate (generate new refresh token, replace stored hash)
5. Implement `POST /api/auth/logout` to remove stored refresh token and clear cookie
6. Add `auth` middleware to guard protected routes (reads Authorization: Bearer)
7. Add Postman examples and bcrypt/jwt tests in `tests/auth.test.js`

Day 4 — Media uploads & Cloudinary (exact tiny steps)

1. `config/cloudinary.js`: configure `cloudinary.v2.config({ cloud_name, api_key, api_secret })`
2. Add `routes/media.js` + `controllers/mediaController.js`
3. Implement `POST /api/media/sign`:
   - Accept `{ folder, resource_type }` and return `timestamp`, `signature`, `api_key` for direct upload
4. Implement server fallback upload `POST /api/media/upload` (multer -> upload to Cloudinary)
5. Validate file types and sizes:
   - images: jpeg/png/webp max 5MB
   - videos: mp4/webm max 50MB (MVP) and duration <= 60s for reels
6. Add Cloudinary unsigned presets for client uploads or prefer server-signed for security
7. Add helper to generate Cloudinary thumbnail URLs and video transformations

Day 5 — Posts & Feed (exact tiny steps)

1. `routes/posts.js` + `controllers/postController.js`
2. `POST /api/posts` body: `{ text, media: [{ url, type, public_id, duration }], visibility = 'public'|'friends', type='post'|'reel' }`
3. Persist post and update user's post count if desired
4. `GET /api/posts/feed?limit=20&cursor=<ISODate>`:
   - Query posts where author in `[user, ...friends]` and visibility allows
   - Sort by createdAt desc; return `nextCursor` as last item's createdAt
5. Implement likes endpoint `POST /api/posts/:id/like` toggling presence in `likes` array and updating `likesCount` atomically using `$addToSet` / `$pull` and `$inc`
6. Ensure media metadata saved (width/height/duration) for client rendering

Day 6 — Reels (exact tiny steps)

1. Use `Post.type = 'reel'` and ensure `media` contains video metadata
2. Implement `POST /api/posts` with `type: 'reel'` and server-side validation ensuring `media` contains a video url and `duration <= 60`
3. `GET /api/reels/feed?limit=10&cursor=`:
   - Return posts where `type='reel'`, ordered by popularity or recency (start with recency)
   - Include video poster (thumbnail), aspect ratio, duration, author
4. Cloudinary transforms:
   - Use `e_preview` and `q_auto` for web-friendly previews
   - Provide HLS or progressive mp4 for efficient streaming (MVP: mp4)
5. Client UX notes: autoplay, muted by default, tap to like, swipe up/down to next/prev

Day 7 — Comments, Likes, Notifications (exact tiny steps)

1. Implement `POST /api/posts/:id/comments` (validate author, text length, optional parentCommentId)
2. Ensure comments increment `commentsCount` atomically
3. Create notifications when:
   - someone likes your post
   - someone comments on your post
   - friend requests/accepts
4. `GET /api/notifications?page=1&limit=20` — return newest first
5. `POST /api/notifications/mark-read` body `{ ids: [] }` or `{ all: true }`
6. When creating a Notification, emit via Socket.IO to `user:<recipientId>`

Day 8 — Conversations & Real-time (exact tiny steps)

1. Socket bootstrap in `server.js`:
   - `io.use` to verify JWT in handshake or require `authenticate` event first
2. Socket events to implement in `services/socket.js`:
   - `authenticate` -> attach socket to `user:<id>` room
   - `joinConversation` / `leaveConversation`
   - `sendMessage` -> persist message, update conversation.lastMessage, emit `message` to participants
   - `typing` -> broadcast typing events
   - `markSeen` -> update message.readAt and emit `messageSeen`
3. REST endpoints for conversation history: `GET /api/conversations`, `GET /api/conversations/:id/messages`
4. Add simple presence tracking: maintain `onlineUsers` map in memory for MVP

Day 9 — Frontend skeleton & Upload UI (exact tiny steps)

1. Scaffold React app (create-react-app or Vite). Example with Vite + React:

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install axios socket.io-client
```

2. Pages to scaffold: `Feed`, `Reels`, `Upload`, `Auth` (login/signup), `Conversation`
3. Upload flow (client):
   - Request signature from `POST /api/media/sign` with `{ folder: 'posts'|'reels', resource_type: 'video'|'image' }`
   - Upload directly to Cloudinary using the returned signature and timestamp
   - On success, send `POST /api/posts` with returned `url` and metadata
4. Reels UI: vertical list, use `IntersectionObserver` to autoplay visible video
5. Feed UI: infinite scroll by cursor; show post composer with image/video upload button

Day 10 — Tests, CI, Deploy & Polish (exact tiny steps)

1. Write tests in `backend/src/tests` for:
   - auth flows: signup/login/refresh/logout
   - posts: create/read/feed/like
   - media signature endpoint
2. Add GitHub Actions workflow `.github/workflows/test.yml` to run `npm test`
3. Prepare deployment notes:
   - Use Render / Railway; ensure env vars set
   - For sockets in production, add Redis and socket.io-redis adapter
4. Run lint and prettier; fix minor issues
5. Finalize README with env vars and run commands

Extras & tiny checklist items (do not forget)

- Add CORS restrict origins for prod
- Add rate limiter for auth endpoints
- Add size/type checks on frontend before upload to save bandwidth
- Add a background job plan for long video processing if you accept large uploads (use worker + queue)
- Document API shapes in `postman_collection.json`

What I just did

- Created this detailed, merged 10-day plan and saved it to `plan 2.md` at the repo root.

Next options (pick one)

- A: I generate skeleton backend files for Day 1 (app.js, server.js, db.js, package.json scripts).
- B: I generate full `routes/auth.js` + `controllers/authController.js` for Day 3 (auth flow).
- C: I scaffold the frontend upload UI components for Reels and Feed (Day 9).

Tell me which option and I'll implement it next.
