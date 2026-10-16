import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './redux/store.js'
import { persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'
import { SocketContextProvider } from './context/SocketContext.jsx'
import { CallContextProvider } from './context/CallContext.jsx'
import IncomingCallModal from './components/IncomingCallModal.jsx'
import VideoCallModal from './components/VideoCallModal.jsx'

const persistor = persistStore(store);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SocketContextProvider>
          <CallContextProvider>
            <App />
            <IncomingCallModal />
            <VideoCallModal />
          </CallContextProvider>
        </SocketContextProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
)
