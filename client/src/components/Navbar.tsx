import { useNavigate } from "react-router-dom";
import { hasToken, getUsernameFromToken } from "../util/util";

function Navbar() {
  const navigate = useNavigate();
  const loggedIn = hasToken();
  const username = getUsernameFromToken();

  function handleLogout() {
    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "username=; path=/; max-age=0";
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <span className="navbar-logo" onClick={() => navigate("/")}>
        Dog Dash
      </span>
      <div className="navbar-links">
        <button className="nav-link" onClick={() => navigate("/")}>Browse</button>
        {loggedIn ? (
          <>
            <button className="nav-link" onClick={() => navigate(`/levels/${username}`)}>My Levels</button>
            <button className="nav-link" onClick={() => navigate("/profile")}>{username}</button>
            <button className="btn btn-outline" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <button className="nav-link" onClick={() => navigate("/login")}>Log in</button>
            <button className="btn" onClick={() => navigate("/register")}>Register</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;