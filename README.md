# 💬 Chatly — Enterprise Real-Time Chat, Group Collaboration & WebRTC Video Calling Platform

<div align="center">

[![React 19](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express 5](https://img.shields.io/badge/Express-5.2.1-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.io-4.8.4-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Peer--to--Peer-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**A high-performance, full-stack real-time communication platform engineered with modern React 19, Express 5, Socket.IO, WebRTC peer-to-peer video/audio calling, voice note recording, multilingual speech-to-text, and resilient Cloudinary media sharing.**

[Key Features](#-key-features) • [Architecture](#-system-architecture) • [Tech Stack](#-technology-stack) • [Socket.IO Events](#-socketio-event-matrix) • [API Reference](#-api-endpoints-reference) • [Installation](#-getting-started) • [Deployment](#-production-deployment)

</div>

---

## 📌 Executive Summary

**Chatly** is a production-ready real-time messaging application engineered with a clean monorepo architecture. Designed with WhatsApp-inspired aesthetics and enterprise-grade reliability, it delivers sub-second message delivery, WebRTC P2P audio/video calling, rich media sharing with automatic local/CDN failover, and comprehensive messaging utilities (replies, edit/delete, emoji reactions, forward, in-chat search, and delivery status ticks).

---

## 🚀 Key Features

### 1. ⚡ Real-Time 1-to-1 Messaging & Live Presence
- **Sub-millisecond Latency**: Powered by Socket.IO duplex communication with automatic transport fallback (`websocket` → `polling`).
- **Live User Presence**: Instant online/offline detection using a synchronized in-memory connection map (`userSocketMap`) supporting multi-tab sessions and reconnects.
- **Typing Indicators**: Real-time debounce typing notifications with animated pulse waves.
- **Offline Message Queuing**: Messages sent to offline users are automatically marked as `delivered` the moment the recipient reconnects.

### 2. 👥 Group Chat & Collaborative Workspaces
- **Role-Based Group Administration**: Group creators are assigned Admin privileges with controls to add/remove members, update group avatar/description, or delete group.
- **Self-Service Leave**: Group members can leave groups at any time with automatic membership list synchronization.
- **Dedicated Room Broadcasting**: Socket.IO room isolation (`socket.join(groupId)`) ensures group typing events and messages never leak outside room boundaries.

### 3. 🎥 WebRTC 1-to-1 Video & Audio Calling
- **Pure Peer-to-Peer Media Streams**: Direct browser-to-browser media exchange via standard `RTCPeerConnection` with public STUN servers.
- **Signaling over Socket.IO**: Low-latency handshake orchestration for SDP Offer/Answer negotiation and ICE Candidate gathering.
- **Ringing & Call Modals**: Visual & audio incoming call alerts with Accept / Decline controls.
- **In-Call Stream Controls**: Dynamic camera toggle, microphone mute/unmute, local self-view picture-in-picture, remote video full screen, and live call duration timer.

### 4. 🎙️ Voice Notes & Speech-to-Text (Voice Typing)
- **Audio Voice Notes**: Built-in audio recorder via `MediaRecorder` API with animated waveform bars, live duration timer, cancel/trash, and instant pre-send audio player preview.
- **Custom Audio Bubble Player**: WhatsApp-style playback controls with scrubbable progress bar, elapsed/total time formatting, and dynamic play/pause state.
- **Multilingual Voice Typing**: Native browser Speech Recognition integration supporting **Hindi (`hi-IN`)**, **Indian English (`en-IN`)**, and **US English (`en-US`)** with continuous transcription.
- **Permission Diagnostics**: Contextual modal guiding users if microphone permissions are denied in Chrome, Safari, or Brave.

### 5. 🖼️ Complete 5-Step Resilient Image Sharing
- **Format Validation**: Strict validation for `JPG`, `PNG`, and `WebP` files with a 15MB file-size ceiling.
- **Pre-Send Preview Modal**: High-resolution image preview card, file metadata indicator, and optional caption input.
- **Resilient Upload Engine**: Seamless integration with **Cloudinary v2 CDN** featuring an automatic **Base64 Data URI failover** mechanism so media uploads never fail even when external CDN credentials are unconfigured or rate-limited.
- **Chat Display**: Rounded responsive thumbnail, caption card, send timestamp in user's local timezone, and delivery status indicators.
- **Full-Screen Lightbox Viewer**: Backdrop blur modal, keyboard shortcut support (`Escape` to close), sender metadata header, and a direct download utility via Blob streams (`URL.createObjectURL`).

### 6. 💬 Advanced Message Utilities
- **Quoted Replies**: Interactive reply card linking back to the original message; clicking the quoted bubble triggers an animated scroll-and-glow highlight (`#msg-id`).
- **Edit & Delete for Everyone**: Senders can edit text messages with an "Edited" badge or delete messages for everyone with real-time UI state sync.
- **Emoji Reactions**: Quick-picker reaction bar (`👍`, `❤️`, `😂`, `😮`, `😢`, `🙏`) with dynamic counter pills and toggle-to-remove capability.
- **Message Forwarding**: Clean modal allowing users to instantly forward messages to any contact or group.
- **In-Chat Message Search**: Real-time regex text search with live match counters, previous/next jump navigation buttons, and auto-scrolling.

### 7. ✓✓ Delivery & Read Status Lifecycle
- **Single Grey Tick (`✓`)**: Message received and persisted to MongoDB on the server.
- **Double Grey Ticks (`✓✓`)**: Receiver's active socket confirmed delivery on their device.
- **Double Blue Ticks (`✓✓`)**: Receiver opened the chat conversation (`mark_read` socket event).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 19 + Vite + Redux Toolkit)"]
        UI[Responsive Chat UI]
        Redux[Redux Auth & Messages Store]
        SocketClient[Socket.IO Client]
        WebRTCClient[WebRTC RTCPeerConnection]
        MediaRec[MediaRecorder & Audio API]
    end

    subgraph Gateway ["Reverse Proxy & Server (Node.js + Express 5)"]
        Server[Express 5 HTTP / HTTPS Server]
        AuthMW[JWT HttpOnly Cookie Middleware]
        MulterMW[Multer Disk Storage Middleware]
        SocketServer[Socket.IO Gateway Server]
    end

    subgraph Storage ["Database & Storage Services"]
        MongoDB[(MongoDB Atlas)]
        Cloudinary[(Cloudinary Media CDN)]
        LocalStorage[(Local Fallback / Data URI)]
    end

    UI --> Redux
    UI --> SocketClient
    UI --> WebRTCClient
    UI --> MediaRec

    SocketClient <==> |WebSockets Duplex / WebRTC Signaling| SocketServer
    WebRTCClient <===> |P2P Audio & Video Streams (STUN)| WebRTCClient
    
    UI --> |REST API Requests| Server
    Server --> AuthMW --> MulterMW
    MulterMW --> Cloudinary
    MulterMW -.-> |Fallback| LocalStorage
    Server --> MongoDB
    SocketServer --> MongoDB
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) • [Vite 7](https://vitejs.dev/) • [React Router DOM v7](https://reactrouter.com/) |
| **State Management** | [Redux Toolkit](https://redux-toolkit.js.org/) • [Redux Persist](https://github.com/rt2zz/redux-persist) |
| **Styling & UI** | [TailwindCSS v4](https://tailwindcss.com/) • [React Icons](https://react-icons.github.io/react-icons/) • [Emoji Picker React](https://www.npmjs.com/package/emoji-picker-react) |
| **Networking & Real-Time** | [Socket.IO Client](https://socket.io/) • [Axios](https://axios-http.com/) • Native WebRTC (`RTCPeerConnection`) |
| **Audio & Speech APIs** | HTML5 Audio API • MediaStream Recording API • Web Speech API (`webkitSpeechRecognition`) |
| **Backend Runtime** | [Node.js (ES Modules)](https://nodejs.org/) • [Express v5.2](https://expressjs.com/) |
| **Real-Time Gateway** | [Socket.IO v4.8](https://socket.io/) with CORS credentialing & room isolation |
| **Database & ODM** | [MongoDB](https://www.mongodb.com/) • [Mongoose v9.0](https://mongoosejs.com/) |
| **Authentication** | [JSON Web Tokens (JWT)](https://jwt.io/) in secure `HttpOnly` cookies • [BcryptJS](https://github.com/dcodeIO/bcrypt.js) |
| **Media Pipeline** | [Multer 2](https://github.com/expressjs/multer) • [Cloudinary v2 SDK](https://cloudinary.com/) with Base64 Data URI fallback |

---

## 📂 Project Directory Layout

```text
chat_app_live/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js       # Cloudinary SDK init & resilient Data URI fallback
│   │   ├── db.js               # MongoDB Mongoose connection handler
│   │   └── token.js            # JWT token signing & verification utility
│   ├── controllers/
│   │   ├── auth.controller.js  # Register, login, and logout routines
│   │   ├── group.controller.js # Group CRUD, membership, & message dispatch
│   │   ├── message.controller.js# 1-to-1 messaging, edit, delete, react, forward
│   │   └── user.controller.js  # Profile management, contact lists, search
│   ├── middlewares/
│   │   ├── isAuth.js           # JWT token verification middleware
│   │   └── multer.js           # Safe disk storage with auto-directory creation
│   ├── models/
│   │   ├── conversation.model.js # 1-to-1 conversation tracking schema
│   │   ├── group.model.js      # Group schema with admin & member arrays
│   │   ├── message.model.js    # Schema for text, audio, images, reactions, status
│   │   └── user.model.js       # User profile and auth schema
│   ├── routes/
│   │   ├── auth.route.js       # /api/auth routes
│   │   ├── group.route.js      # /api/group routes
│   │   ├── message.route.js    # /api/message routes
│   │   └── user.route.js       # /api/user routes
│   ├── socket/
│   │   └── socket.js           # Socket.IO gateway, presence, & WebRTC signaling
│   ├── server.js               # Express application entrypoint
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/             # Default avatars & static media assets
│   │   ├── components/
│   │   ├── context/
│   │   │   ├── CallContext.jsx # WebRTC call state machine & peer connection
│   │   │   └── SocketContext.jsx# Socket connection lifecycle provider
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Primary chat layout & responsive container
│   │   │   ├── Login.jsx       # Authentication login screen
│   │   │   ├── Profile.jsx     # User profile editor with avatar upload
│   │   │   └── SignUp.jsx      # New account registration
│   │   ├── redux/
│   │   │   ├── store.js        # Redux Toolkit store with persistence
│   │   │   └── userSlice.js    # Auth, contacts, groups, & message reducers
│   │   ├── utils/
│   │   │   ├── constant.js     # API & backend URL environment resolvers
│   │   │   ├── dateUtils.js    # Localized date separators & 12h time formatting
│   │   │   └── sound.js        # Audio alert synthesis for notifications
│   │   ├── App.jsx             # Main routing configuration
│   │   └── main.jsx            # React root mount
│   ├── vite.config.js          # Vite 7 build & alias config
│   └── package.json
│
└── README.md
```

---

## 📡 Socket.IO Event Matrix

| Event Name | Direction | Payload | Description |
| :--- | :---: | :--- | :--- |
| `getOnlineUsers` | Server → Client | `string[]` (User IDs) | Broadcasts all currently online active user IDs |
| `typing` / `stop_typing` | Bidirectional | `{ receiverId, senderId }` | Emitted when a contact starts/stops typing in a 1-to-1 chat |
| `newMessage` | Server → Client | `Message` object | Real-time push of a newly received direct message |
| `message_delivered` | Client → Server | `{ messageId, senderId }` | Recipient client confirms message was received |
| `messageDelivered` | Server → Client | `{ messageId, status }` | Notifies original sender that message reached recipient |
| `mark_read` | Client → Server | `{ senderId }` | Triggered when user opens chat to mark incoming messages as read |
| `messagesRead` | Server → Client | `{ readerId }` | Notifies original sender that messages have turned blue (`✓✓`) |
| `messageEdited` | Server → Client | `Message` object | Broadcasts updated content when a message is edited |
| `messageDeleted` | Server → Client | `{ messageId }` | Broadcasts message deletion flag to all chat participants |
| `messageReaction` | Server → Client | `{ messageId, reactions }` | Real-time sync of emoji reactions on a message bubble |
| `join_group` / `leave_group` | Client → Server | `groupId` | Joins or departs a group Socket.IO room |
| `group_typing` | Bidirectional | `{ groupId, userName }` | Broadcasts typing notifications inside a group room |
| `newGroupMessage` | Server → Client | `Message` object | Dispatches new group message to all members in the group room |
| `call:start` | Client → Server | `{ recipientId, callType }` | Initiates WebRTC call request to recipient |
| `call:incoming` | Server → Client | `{ callerId, callerName }` | Alerts recipient of incoming video/audio call |
| `call:accept` | Client → Server | `{ callerId }` | Recipient accepts call; triggers local stream acquisition |
| `call:reject` / `call:end`| Bidirectional | `{ targetId, reason }` | Declines or terminates active WebRTC session |
| `webrtc:signal` | Bidirectional | `{ targetId, signalData }` | Relays SDP offers, SDP answers, and ICE candidates |

---

## 🔌 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/signup` — Register a new account (`name`, `userName`, `email`, `password`).
- `POST /api/auth/login` — Authenticate and receive `HttpOnly` JWT cookie.
- `GET /api/auth/logout` — Invalidate JWT cookie and end session.

### 👤 User Management (`/api/user`)
- `GET /api/user/current` — Fetch authenticated user details.
- `GET /api/user/others` — List all chat contacts excluding the current user.
- `PUT /api/user/profile` — Update user name and avatar (`multipart/form-data`).
- `GET /api/user/search?query=...` — Search registered users by name or username.

### 💬 Messaging (`/api/message`)
- `GET /api/message/:id` — Retrieve full conversation history with a user (auto-marks read).
- `POST /api/message/send/:id` — Send text, voice note, or image with optional caption and `replyTo`.
- `PUT /api/message/edit/:id` — Edit an existing message owned by the caller.
- `DELETE /api/message/delete/:id` — Delete a message for everyone.
- `POST /api/message/react/:id` — Add or toggle an emoji reaction.
- `POST /api/message/forward` — Forward a message to another user or group.
- `GET /api/message/search/:chatId?query=...` — Search message history within a conversation.

### 👥 Group Collaboration (`/api/group`)
- `POST /api/group/create` — Create a new group with title, description, avatar, and members.
- `GET /api/group/my-groups` — Fetch all groups the authenticated user belongs to.
- `GET /api/group/messages/:groupId` — Retrieve group message history.
- `POST /api/group/send/:groupId` — Dispatch a message to the group.
- `PUT /api/group/add-members/:groupId` — Add new members (Admin only).
- `PUT /api/group/remove-member/:groupId` — Remove a member (Admin only).
- `POST /api/group/leave/:groupId` — Leave a group.

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)
- Modern browser with WebRTC and Speech Recognition support (Chrome, Edge, Safari, Brave)

---

### Step 1: Clone Repository
```bash
git clone https://github.com/abhishek23027kushwaha/chat_app_live.git
cd chat_app_live
```

---

### Step 2: Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file inside `backend/`:
   ```env
   # Server Port
   PORT=8000

   # MongoDB Connection
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/chat_app?retryWrites=true&w=majority

   # JWT Secret Key
   JWT_SECRET=your_super_secret_jwt_key_here

   # Cloudinary Credentials (Optional - Local Data URI fallback will activate if blank)
   CLOUD_NAME=your_cloudinary_cloud_name
   API_KEY=your_cloudinary_api_key
   API_SECRET=your_cloudinary_api_secret
   ```

3. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will initialize on `http://localhost:8000` and establish database connection.*

---

### Step 3: Frontend Setup
1. In a separate terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. (Optional) Create a `.env` file inside `frontend/` if overriding the default API URL:
   ```env
   VITE_SERVER_URL=http://localhost:8000
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:5173`.*

---

## 🧪 Testing the Complete Experience

1. **Two Browser Profiles**: Open `http://localhost:5173` in a standard browser window and another instance in an **Incognito / Private Window**.
2. **Account Creation**: Register User A and User B.
3. **Real-time Messaging**: Select User B from User A's contact list; observe immediate online status and typing indicators.
4. **WebRTC Video Call**: Click the video camera icon (`IoVideocam`) in the top chat header. User B will receive an incoming ringing modal. Click **Accept** to initiate two-way P2P video & audio.
5. **Image Sharing**: Click the picture icon (`FaImages`), select a JPG/PNG/WebP image, review the preview modal, enter an optional caption, and click **Send**. Click on the received image bubble to view in full-screen lightbox or download it.
6. **Voice Note**: Hold or click the microphone icon (`FaMicrophone`), record audio with waveform animation, preview playback, and hit send.

---

## 🚢 Production Deployment

### Building for Production
To generate minified production bundles:
```bash
# In frontend directory
npm run build
```
The compiled assets will be output to `frontend/dist/`. The Express backend is configured to automatically serve these static files when running in a single-instance container.

### Deploying to Render / Railway
1. **Root Directory**: `.`
2. **Build Command**:
   ```bash
   npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend
   ```
3. **Start Command**:
   ```bash
   npm start --prefix backend
   ```
4. **Environment Variables**: Add `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLOUD_NAME`, `API_KEY`, and `API_SECRET` to the cloud platform's environment dashboard.

---

## 🛡️ Security Highlights

- **HttpOnly & Secure Cookies**: Authentication tokens are stored exclusively in `HttpOnly`, `SameSite` cookies, rendering tokens inaccessible to malicious client scripts (XSS mitigation).
- **Password Salting & Hashing**: All passwords are cryptographically hashed using `bcryptjs` with auto-generated salt rounds.
- **Strict Multipart Sanitization**: File uploads are restricted by MIME type with randomized filenames to eliminate directory traversal risks.
- **CORS Allowlist Engine**: Dynamic origin validation ensuring only verified client domains can access authenticated endpoints.

---

## 📄 License

Distributed under the **ISC License**. Feel free to use, modify, and distribute for personal and commercial projects.

---

<div align="center">
  <b>Built with ❤️ by Abhishek Kumar</b><br>
  <i>Empowering seamless communication through modern web technologies.</i>
</div>
