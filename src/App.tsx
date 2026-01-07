import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Reader from './pages/Reader';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Reader />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
