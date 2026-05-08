# Frontend Plan for Social Media App

This is a clear 7-day frontend roadmap for your social media project.

Your stack will focus on:

- React + Vite
- Redux Toolkit for state management
- Tailwind CSS for styling
- shadcn/ui for ready-made UI components
- Axios for API calls
- React Router DOM for pages and navigation
- react-hook-form + zod for forms and validation
- React Dropzone for file uploads
- Framer Motion for small animations
- Lucide React for icons
- Sonner for toast messages
- Date-fns for formatting dates and times

You said you do not want React Query, so this plan uses Redux Toolkit only for data and app state.

## What Each Package Is For

| Package                     | What you use it for                                                   |
| --------------------------- | --------------------------------------------------------------------- |
| `react-router-dom`          | Page routing like `/login`, `/feed`, `/profile/:id`                   |
| `@reduxjs/toolkit`          | Redux store, slices, async thunks, and app state                      |
| `react-redux`               | Connect React components to Redux store                               |
| `axios`                     | Send requests to your backend API                                     |
| `tailwindcss`               | Utility CSS classes for layout and styling                            |
| `shadcn/ui`                 | Reusable UI components like buttons, dialogs, tabs, menus             |
| `lucide-react`              | Icons for navbar, buttons, actions, and menus                         |
| `clsx`                      | Combine conditional class names cleanly                               |
| `tailwind-merge`            | Prevent conflicting Tailwind classes from overriding each other badly |
| `class-variance-authority`  | Build reusable component variants like button sizes and styles        |
| `tailwindcss-animate`       | Add smooth animations for dialogs, dropdowns, and transitions         |
| `react-hook-form`           | Handle form inputs efficiently without too much boilerplate           |
| `zod`                       | Validate login, register, OTP, and post forms                         |
| `@hookform/resolvers`       | Connect Zod with React Hook Form                                      |
| `react-dropzone`            | Drag-and-drop file upload area for images and videos                  |
| `react-player`              | Play uploaded or embedded videos                                      |
| `framer-motion`             | Animate modals, cards, dropdowns, and page transitions                |
| `sonner`                    | Toast notifications like success, error, and info messages            |
| `date-fns`                  | Format times like “2h ago”, dates, and timestamps                     |
| `vitest`                    | Run unit tests                                                        |
| `@testing-library/react`    | Test UI components the way users see them                             |
| `@testing-library/jest-dom` | Better DOM assertions in tests                                        |
| `msw`                       | Mock backend API responses during tests                               |

## Suggested Install Commands

```bash
npm install react-router-dom @reduxjs/toolkit react-redux axios
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react framer-motion react-dropzone react-player sonner date-fns
npm install clsx tailwind-merge class-variance-authority tailwindcss-animate
npm install -D vitest @testing-library/react @testing-library/jest-dom msw
```

## Recommended Folder Structure

```text
src/
  app/
    store.js
    providers.jsx
  assets/
  components/
    layout/
    ui/
    auth/
    feed/
    post/
    stories/
    reels/
    messages/
    notifications/
    profile/
    friends/
    search/
    media/
  features/
    auth/
    user/
    posts/
    comments/
    likes/
    friends/
    notifications/
    chat/
    stories/
    reels/
  hooks/
  lib/
    api.js
    constants.js
    utils.js
  pages/
    HomePage.jsx
    LoginPage.jsx
    RegisterPage.jsx
    OtpPage.jsx
    ProfilePage.jsx
    FriendsPage.jsx
    MessagesPage.jsx
    NotificationsPage.jsx
    SearchPage.jsx
    SettingsPage.jsx
  routes/
    AppRoutes.jsx
    ProtectedRoute.jsx
  styles/
  App.jsx
  main.jsx
```

## Core Components You Will Build

### Layout Components

- `TopNavbar` - top bar with search, icons, and profile menu
- `LeftSidebar` - shortcuts, navigation links, saved items
- `RightSidebarContacts` - online contacts and suggestions
- `MobileBottomNav` - bottom navigation on mobile screens
- `MainLayout` - wraps the whole authenticated app

### Auth Components

- `LoginForm` - login inputs and submit button
- `RegisterForm` - name, email, password, confirm password
- `OtpVerificationForm` - OTP code input and verify button
- `ProtectedRoute` - blocks unauthenticated users

### Feed and Post Components

- `CreatePostBox` - text area, media upload, post button
- `PostCard` - full post container
- `PostHeader` - author avatar, name, time, menu
- `PostText` - post content text
- `PostMedia` - images or videos inside the post
- `PostActions` - like, comment, share buttons
- `CommentSection` - comment list below a post
- `CommentItem` - one comment row
- `CommentInput` - write a new comment
- `FeedSkeleton` - loading placeholder for the feed

### Profile Components

- `ProfileHeader` - cover, avatar, name, action buttons
- `ProfileCover` - big cover image
- `ProfileAvatar` - profile picture
- `ProfileTabs` - posts, about, friends, photos
- `ProfilePosts` - user post list
- `ProfileFriendsList` - friend preview cards
- `ProfileAboutCard` - bio and personal info

### Friends Components

- `FriendRequestCard` - request item with accept/reject
- `FriendSuggestionCard` - suggested people to add
- `FriendsList` - all friends on a page
- `FriendsSearchBar` - search friends by name

### Messages Components

- `ConversationsList` - left panel list of chats
- `ConversationItem` - one conversation row
- `ChatWindow` - main message area
- `MessageBubble` - one message bubble
- `MessageInput` - type and send message
- `ChatHeader` - chat title and actions
- `AttachmentPreview` - preview image/file before send

### Notifications Components

- `NotificationItem` - one notification row
- `NotificationDropdown` - top bar dropdown menu
- `NotificationPageList` - full notifications page

### Stories and Reels Components

- `StoriesRow` - horizontal stories strip
- `StoryCard` - one story item
- `StoryViewerModal` - full story viewer
- `ReelsGrid` - list/grid of reels
- `ReelCard` - one reel preview card
- `ReelPlayerModal` - reel playback screen

### Search Components

- `SearchBar` - search input
- `SearchResultsList` - list of results
- `UserResultCard` - user search result
- `PostResultCard` - post search result

### Shared UI Components

- `Button`
- `Input`
- `Textarea`
- `Avatar`
- `Modal`
- `DropdownMenu`
- `Tabs`
- `Badge`
- `Skeleton`
- `Tooltip`
- `Separator`
- `Card`
- `Toast`

### Media Components

- `ImageUploader`
- `VideoUploader`
- `MediaPreview`
- `FilePicker`
- `CropAvatarModal`

## Redux Toolkit Slices

Use Redux Toolkit for the important app state.

Recommended slices:

- `authSlice` - login, register, OTP, token, session state
- `userSlice` - current user profile and selected user data
- `postSlice` - feed posts, like/share/delete, create post state
- `commentSlice` - comments and replies
- `friendSlice` - friend requests, suggestions, accepted friends
- `notificationSlice` - notification list and unread count
- `chatSlice` - conversations and active chat
- `uiSlice` - modals, mobile nav, dropdowns, theme state
- `uploadSlice` - selected files and upload progress

What each slice is for:

- `authSlice` - store login status, OTP status, and auth token
- `userSlice` - store who the current user is and profile details
- `postSlice` - store feed posts and post actions
- `commentSlice` - store comment threads
- `friendSlice` - store friend data and request actions
- `notificationSlice` - store unread counts and notification list
- `chatSlice` - store chat UI state until socket.io is ready
- `uiSlice` - store open/close state for menus and modals
- `uploadSlice` - store files selected for upload and upload progress

Redux tips:

- Use Redux for shared state, not every tiny local input
- Use async thunks for API calls
- Keep loading, success, and error states inside slices
- Use selectors so components stay clean
- Do not overstore API data; keep only what you need

## API Strategy

Use Axios with Redux Toolkit.

Create these API files:

- `api.js` - Axios base instance
- `authApi.js` - login, register, verify OTP
- `userApi.js` - profile and user data
- `postApi.js` - feed posts, create post, delete post
- `commentApi.js` - comments and replies
- `friendApi.js` - friend requests and friend lists
- `notificationApi.js` - notification actions
- `chatApi.js` - conversations and messages later
- `uploadApi.js` - image/video upload handling

How they are used:

- `api.js` holds the base URL and auth token setup
- `authApi.js` handles authentication screens
- `postApi.js` supports feed loading and post creation
- `commentApi.js` handles comment actions under a post
- `friendApi.js` handles friend requests and suggestions
- `notificationApi.js` loads notification data
- `chatApi.js` will be used later for message history
- `uploadApi.js` handles uploading images and videos

API tips:

- Add request interceptors for auth tokens
- Add response interceptors for errors and session expiry
- Use Redux async thunks for loading data
- Use optimistic updates for likes and comments when possible

## 7-Day Detailed Plan

### Day 1: Project Setup and App Structure

What to do:

- Check the current Vite app files
- Install the packages listed above
- Create the folder structure in `src/`
- Add `store.js`, `providers.jsx`, and `api.js`
- Create basic constants for routes, menu items, and labels

What this day gives you:

- A clean project foundation
- A place for Redux, routing, and API code
- A structure that will not become messy later

### Day 2: Tailwind and UI System

What to do:

- Finish Tailwind setup
- Add shadcn/ui components you will reuse often
- Create shared buttons, inputs, cards, avatars, modals, tabs, badges, and skeletons
- Define a Facebook-like theme with blue accents and white cards
- Set consistent spacing, shadows, and border radius

What this day gives you:

- A visual system that looks consistent across the app
- Reusable UI parts instead of repeating styles everywhere

### Day 3: Redux Toolkit Store Setup

What to do:

- Create the Redux store
- Add slices for auth, user, posts, comments, friends, notifications, chat, ui, and upload
- Add async thunks for the first API calls
- Connect Redux Provider in the app root
- Test a simple state update on screen

What this day gives you:

- The state system for the whole app
- The base for login, feed, profile, and messages data

### Day 4: Routing and Main Layout

What to do:

- Add React Router DOM routes
- Create public routes like login, register, and OTP
- Create protected routes for app pages
- Build the main layout with top navbar, left sidebar, right sidebar, and mobile nav
- Make it responsive for mobile and desktop

What this day gives you:

- A working app shell
- Navigation structure like a real social platform

### Day 5: Authentication Flow

What to do:

- Build the login page
- Build the register page
- Build the OTP verification page
- Use react-hook-form for input handling
- Use zod for validation rules
- Connect forms to authSlice and auth API calls

What this day gives you:

- A full login/register/verify flow
- Reusable form logic for later pages

### Day 6: Home Feed and Post Creation

What to do:

- Build the home feed page
- Add the stories row on top
- Add the create post box
- Add post cards with header, content, media, and actions
- Add comment section UI
- Add loading skeletons and empty states

What this day gives you:

- The main Facebook-like experience
- A feed that already feels like a real social app

### Day 7: Profile, Friends, Notifications, Search, and Messages UI

What to do:

- Build the profile page header and tabs
- Add the friends page with requests and suggestions
- Add notifications dropdown and notifications page
- Add search bar and search results page
- Add messages page UI with chat list and chat window
- Add placeholders for socket.io features later

What this day gives you:

- The rest of the important social features
- A complete frontend structure you can keep improving later

## Final Stack Summary

Use this stack:

- React + Vite
- Redux Toolkit + React Redux
- Axios
- React Router DOM
- Tailwind CSS
- shadcn/ui
- react-hook-form + zod
- lucide-react
- react-dropzone
- react-player
- framer-motion
- sonner
- date-fns

## Important Tips

- Use Redux Toolkit for learning global state properly
- Keep local form state local and shared app state in Redux
- Use reusable components so the app stays easy to change
- Build the layout first, then pages, then features
- Keep Socket.io for later and only design placeholders now
- Keep the UI simple, clean, and Facebook-like
- Use loading states and skeletons from the beginning

## Next Best Step

If you want, I can now turn this plan into actual starter files in `src/` day by day.
