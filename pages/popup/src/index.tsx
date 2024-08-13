import { createRoot } from 'react-dom/client';
import '@src/index.css';
import Popup from '@src/Popup';
import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import Login from './screens/Login';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
function init() {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);

  root.render(
    <div className={` h-screen  flex flex-col`}>
      <Header />
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute to="/login">
                <Login />
              </ProtectedRoute>
            }
          />

          <Route path="/home" element={<Popup />} />
        </Routes>
      </Router>
    </div>,
  );
}

init();
