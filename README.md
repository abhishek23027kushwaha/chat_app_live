<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0284C7,100:1797C2&height=220&section=header&text=Chatly%20Live&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Enterprise%20Real-Time%20Chat%2C%20Group%20Collaboration%20%26%20WebRTC%20Video%20Calling%20Platform&descAlignY=60&descSize=18" width="100%"/>

<br/>

<a href="https://github.com/abhishek23027kushwaha/chat_app_live">
  <img src="https://readme-typing-svg.demolab.com?font=Poppins&weight=600&size=20&pause=1000&color=1797C2&center=true&vCenter=true&width=750&lines=Sub-Millisecond+Real-Time+Direct+%26+Group+Messaging;Peer-to-Peer+WebRTC+1-to-1+Video+%26+Audio+Calling;Voice+Notes+Recording+%26+Multilingual+Speech-to-Text;5-Step+Resilient+Image+Sharing+with+Cloudinary;WhatsApp-Style+Delivery+Ticks+%26+Emoji+Reactions" alt="Typing SVG" />
</a>

<br/><br/>

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/abhishek23027kushwaha/chat_app_live)
[![React 19](https://img.shields.io/badge/React%2019-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P%20Calling-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)

<br/>

<img src="https://skillicons.dev/icons?i=react,redux,vite,tailwind,nodejs,express,mongodb,socketio,webrtc,postman&theme=dark" />

<br/><br/>

### **💬 Production-Ready Real-Time Communication & WebRTC Collaboration Suite**

</div>

<br/>

<div align="center">

### 📊 At a Glance

<table width="100%">
<tr>
<td align="center" width="20%">⚡ <b>Messaging Engine</b><br/><h3>Socket.io</h3><sub>Real-Time 1-to-1 & Groups</sub></td>
<td align="center" width="20%">🎥 <b>WebRTC Calling</b><br/><h3>P2P Mesh</h3><sub>HD Video & Audio Streams</sub></td>
<td align="center" width="20%">🎙️ <b>Voice & Speech</b><br/><h3>Audio Notes</h3><sub>Speech-to-Text (hi-IN & en)</sub></td>
<td align="center" width="20%">🖼️ <b>Media Pipeline</b><br/><h3>Cloudinary</h3><sub>5-Step Resilient Upload & CDN</sub></td>
<td align="center" width="20%">✓✓ <b>Status Tracking</b><br/><h3>Read Receipts</h3><sub>Sent · Delivered · Blue Read</sub></td>
</tr>
</table>

</div>

---

## 📖 Table of Contents

**🧭 Architecture & Concepts**

&nbsp;&nbsp;📌 [Overview](#-overview) &nbsp;·&nbsp; ✨ [Key Features](#-key-features) &nbsp;·&nbsp; 🔄 [Real-Time Workflow & Architecture](#-real-time-workflow--architecture) &nbsp;·&nbsp; 📡 [Socket.IO Event Matrix](#-socketio-event-matrix)

**🛠️ Engineering & Development**

&nbsp;&nbsp;🧰 [Tech Stack](#-tech-stack) &nbsp;·&nbsp; 📁 [Project Structure](#-project-structure) &nbsp;·&nbsp; 🚀 [Getting Started](#-getting-started) &nbsp;·&nbsp; 🔑 [Environment Variables](#-environment-variables) &nbsp;·&nbsp; 📡 [API Endpoints](#-api-endpoints)

**🛡️ Security & Delivery**

&nbsp;&nbsp;🔒 [Security & Verification](#-security--verification) &nbsp;·&nbsp; 🚢 [Production Deployment](#-production-deployment) &nbsp;·&nbsp; 🤝 [Contributing](#-contributing) &nbsp;·&nbsp; 📬 [Author & Contact](#-author--contact)

---

## 🧰 Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=react,redux,vite,tailwind,nodejs,express,mongodb,socketio,webrtc,postman&theme=dark" />

</div>

<br/>

<table width="100%">
<tr><th align="left" width="22%">Layer</th><th align="left">Technologies Used</th></tr>
<tr><td>🎨 <b>Frontend UI</b></td><td><b>React 19</b>, <b>Vite 7</b>, <b>Tailwind CSS 4</b>, React Icons, Emoji Picker React</td></tr>
<tr><td>📦 <b>State Management</b></td><td><b>Redux Toolkit</b> (Auth, Users, Groups, Messages), Redux Persist</td></tr>
<tr><td>🎥 <b>WebRTC & Audio</b></td><td><b>RTCPeerConnection</b>, Web Speech API (Speech Recognition), MediaRecorder API, HTML5 Audio</td></tr>
<tr><td>⚙️ <b>Backend Runtime</b></td><td><b>Node.js (ES Modules)</b>, <b>Express 5.2</b>, HTTP server</td></tr>
<tr><td>⚡ <b>Real-Time Gateway</b></td><td><b>Socket.io 4.8</b> & <b>Socket.io-client</b> (Duplex WebSocket signaling, rooms, presence)</td></tr>
<tr><td>🗄️ <b>Database & ODM</b></td><td><b>MongoDB Atlas</b>, <b>Mongoose 9.0</b> (Compound indexes, text search)</td></tr>
<tr><td>🖼️ <b>Media Storage</b></td><td><b>Cloudinary v2 SDK</b> & <b>Multer 2.0</b> (Auto-directory generation, Base64 Data URI fallback)</td></tr>
<tr><td>🔐 <b>Authentication</b></td><td><b>JSON Web Tokens (JWT)</b>, <b>bcryptjs</b>, secure <code>HttpOnly</code> cookies</td></tr>
</table>

<div align="right">

[⬆ back to top](#-table-of-contents)

</div>

---

## 📁 Project Structure

```text
chat_app_live/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js             # Cloudinary configuration & Data URI fallback
│   │   ├── db.js                     # MongoDB connection with Mongoose
│   │   └── token.js                  # JWT token generator
│   ├── controllers/
│   │   ├── auth.controller.js        # Signup, Login, Logout handlers
│   │   ├── group.controller.js       # Group CRUD, admin controls, message dispatch
│   │   ├── message.controller.js     # 1-to-1 messages, edit, delete, react, forward, search
│   │   └── user.controller.js        # User profiles, contact queries, search
│   ├── middlewares/
│   │   ├── isAuth.js                 # JWT cookie verification middleware
│   │   └── multer.js                 # Safe disk storage with auto-directory creation
│   ├── models/
│   │   ├── conversation.model.js     # Direct chat conversation tracker
│   │   ├── group.model.js            # Group model with admin & member arrays
│   │   ├── message.model.js          # Unified message model (text, image, audio, reactions)
│   │   └── user.model.js             # User model with profile data
│   ├── routes/
│   │   ├── auth.route.js
│   │   ├── group.route.js
│   │   ├── message.route.js
│   │   └── user.route.js
│   ├── socket/
│   │   └── socket.js                 # Socket.io gateway, WebRTC signaling & presence
│   ├── server.js                     # Express application entry point & HTTP/WS boot
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/                   # Avatars & static fallback images
│   │   ├── components/
│   │   │   ├── AudioPlayer.jsx       # Custom audio bubble with progress scrub
│   │   │   ├── CreateGroupModal.jsx  # New group modal with avatar & member selection
│   │   │   ├── ForwardModal.jsx      # Message forward selector modal
│   │   │   ├── GroupInfoModal.jsx    # Group details, admin actions, member management
│   │   │   ├── ImagePreviewModal.jsx # Pre-send image preview modal with caption
│   │   │   ├── ImageViewerModal.jsx  # Full-screen lightbox viewer with direct download
│   │   │   ├── IncomingCallModal.jsx # WebRTC incoming call ringing banner
│   │   │   ├── MessageArea.jsx       # Chat feed, active conversation container & input bar
│   │   │   ├── MicPermissionModal.jsx# Diagnostic modal for blocked microphone permissions
│   │   │   ├── ReceiverMessage.jsx   # Incoming message bubble (image, audio, reply, react)
│   │   │   ├── SenderMessage.jsx     # Outgoing message bubble with delivery status ticks
│   │   │   ├── SideBar.jsx           # Contacts list, groups tab, search & user profile
│   │   │   └── VideoCallModal.jsx    # WebRTC video/audio call canvas & media stream controls
│   │   ├── context/
│   │   │   ├── CallContext.jsx       # WebRTC state machine & RTCPeerConnection lifecycle
│   │   │   └── SocketContext.jsx     # Socket.io connection & presence context
│   │   ├── pages/
│   │   │   ├── Home.jsx              # Main authenticated workspace container
│   │   │   ├── Login.jsx             # User authentication login view
│   │   │   ├── Profile.jsx           # User profile editor & avatar manager
│   │   │   └── SignUp.jsx            # New account registration view
│   │   ├── redux/
│   │   │   ├── store.js              # Redux store with redux-persist configuration
│   │   │   └── userSlice.js          # Auth, contacts, groups, messages state slices
│   │   ├── utils/
│   │   │   ├── constant.js           # API server URL resolver
│   │   │   ├── dateUtils.js          # Date separator logic & local timezone formatting
│   │   │   └── sound.js              # Ringing & notification audio synthesizers
│   │   ├── App.jsx                   # Route provider & top-level layout
│   │   └── main.jsx                  # React 19 root bootstrap
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

<div align="right">

[⬆ back to top](#-table-of-contents)

</div>

---

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js** (v18.0 or higher)
- **MongoDB** (Local instance or MongoDB Atlas cluster URI)
- Modern web browser with WebRTC and Web Speech API support (Chrome, Edge, Safari, Brave)

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/abhishek23027kushwaha/chat_app_live.git
cd chat_app_live
```

---

### 2️⃣ Backend Configuration

Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
# Server Port
PORT=8000

# MongoDB Connection String
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/chat_app?retryWrites=true&w=majority

# JWT Secret Key
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudinary Credentials (Optional - Local Data URI fallback will automatically activate if omitted)
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
```

Start the backend server:
```bash
npm run dev
```
> The backend server will start on `http://localhost:8000` with WebSocket listeners active.

---

### 3️⃣ Frontend Configuration

Open a second terminal window and navigate to `frontend/`:
```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/` (Optional):
```env
VITE_SERVER_URL=http://localhost:8000
```

Run the frontend development server:
```bash
npm run dev
```
> The React app will run at `http://localhost:5173`.

---

### 🧪 Multi-Profile Testing Guide

1. Open `http://localhost:5173` in a standard browser tab.
2. Open `http://localhost:5173` in an **Incognito / Private Window** (or a different browser).
3. Register **User 1** in Tab A and **User 2** in Tab B.
4. Select User 2 in Tab A: observe live **Online** status badge and real-time typing indicators.
5. Click the video icon (`IoVideocam`) to test **WebRTC video calling** with audio/video stream controls.
6. Click the picture icon (`FaImages`) to test the **5-step image preview, captioning, and full-screen lightbox viewer**.
7. Hold or click the mic button (`FaMicrophone`) to record and send an **audio voice note**.

<div align="right">

[⬆ back to top](#-table-of-contents)

</div>

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :---: | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user (`name`, `userName`, `email`, `password`) |
| `POST` | `/api/auth/login` | Authenticate credentials and set `HttpOnly` JWT cookie |
| `GET` | `/api/auth/logout` | Invalidate cookie and clear user session |

### 👤 User Management (`/api/user`)
| Method | Endpoint | Description |
| :---: | :--- | :--- |
| `GET` | `/api/user/current` | Retrieve authenticated user profile |
| `GET` | `/api/user/others` | Retrieve list of registered chat contacts |
| `PUT` | `/api/user/profile` | Update profile information and avatar (`multipart/form-data`) |
| `GET` | `/api/user/search?query=...` | Search users by name or username |

### 💬 Messaging (`/api/message`)
| Method | Endpoint | Description |
| :---: | :--- | :--- |
| `GET` | `/api/message/:id` | Fetch conversation history with user & auto-mark as read |
| `POST` | `/api/message/send/:id` | Send text, voice note, or image with caption and `replyTo` |
| `PUT` | `/api/message/edit/:id` | Edit message content (author only) |
| `DELETE` | `/api/message/delete/:id` | Delete message for everyone |
| `POST` | `/api/message/react/:id` | Add or toggle emoji reaction on message |
| `POST` | `/api/message/forward` | Forward message to selected contact or group |
| `GET` | `/api/message/search/:chatId?query=...` | Full-text search within chat message history |
| `PUT` | `/api/message/read/:senderId` | Mark all unread incoming messages as read |

### 👥 Group Workspaces (`/api/group`)
| Method | Endpoint | Description |
| :---: | :--- | :--- |
| `POST` | `/api/group/create` | Create new group with name, description, avatar, members |
| `GET` | `/api/group/my-groups` | Retrieve all groups the current user is a member of |
| `GET` | `/api/group/messages/:groupId` | Fetch message history for target group |
| `POST` | `/api/group/send/:groupId` | Send text, image, or audio note to group |
| `PUT` | `/api/group/add-members/:groupId` | Add new users to group (Admin only) |
| `PUT` | `/api/group/remove-member/:groupId` | Remove user from group (Admin only) |
| `POST` | `/api/group/leave/:groupId` | Leave group voluntarily |

<div align="right">

[⬆ back to top](#-table-of-contents)

</div>

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

<div align="right">

[⬆ back to top](#-table-of-contents)

</div>

---

## 🔒 Security & Verification

- **HttpOnly Cookies:** Authentication tokens are stored exclusively in `HttpOnly`, `SameSite` cookies to prevent client-side XSS token extraction.
- **Bcrypt Password Salting:** Cryptographically secure password hashing prevents rainbow-table vulnerability.
- **Fail-Safe Media Storage:** Multer dynamically auto-generates upload storage paths, while Cloudinary integration provides fallback Base64 serialization so media operations never fail or block user interaction.
- **CORS Domain Whitelisting:** Strict cross-origin policy safeguards endpoints from unauthorized domain invocations.

<div align="right">

[⬆ back to top](#-table-of-contents)

</div>

---

## 🚢 Production Deployment

### Building the Production Bundle
To create a minified, production-optimized client build:
```bash
cd frontend
npm run build
```
The compiled assets will be placed in `frontend/dist/`. The Express backend is configured to automatically serve these static files when deployed as a unified service.

### Unified Deployment (Render / Railway / Heroku)
1. Set the root build command:
   ```bash
   npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend
   ```
2. Set the start command:
   ```bash
   npm start --prefix backend
   ```
3. Configure environment variables in your deployment dashboard:
   `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLOUD_NAME`, `API_KEY`, `API_SECRET`.

<div align="right">

[⬆ back to top](#-table-of-contents)

</div>

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📬 Author & Contact

<div align="center">

**Abhishek Kushwaha**

[![Email](https://img.shields.io/badge/Email-abhishek8888raj%40gmail.com-1797C2?style=for-the-badge&logo=gmail&logoColor=white)](mailto:abhishek8888raj@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-abhishek23027kushwaha-181717?style=for-the-badge&logo=github)](https://github.com/abhishek23027kushwaha)

⭐ **If you find this project useful, don't forget to give it a star on GitHub!** ⭐

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1797C2,100:0284C7&height=100&section=footer" width="100%"/>

</div>
