import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import LevelDetail from "./pages/LevelDetail";
import UserLevels from "./pages/UserLevels";
import LevelEditor from "./pages/LevelEditor";
import PlayLevel from "./pages/PlayLevel";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/levels" element={<div>Browse Levels</div>} />
        <Route path="/levels/:username" element={<UserLevels />} />
        <Route path="/levels/:username/:id" element={<LevelDetail />} />
        <Route path="/editor/:id" element={<LevelEditor />} />
        <Route path="/play/:username/:id" element={<PlayLevel />} />
      </Routes>
    </Router>
  );
}

export default App;
