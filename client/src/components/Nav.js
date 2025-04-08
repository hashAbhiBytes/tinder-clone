const Nav = ({ authToken, minimal, setShowModal, showModal, setIsSignUp }) => {
  const handleClick = () => {
    setShowModal(true);
    setIsSignUp(false);
  };

  return (
    <nav>
      <div className="logo-container">
        <div className="logo-combo">
          <img src={require("../images/logo.png")} alt="logo" className="logo-icon" />
          <h1 className="logo-text">CRUSHIN'</h1>
        </div>
      </div>



      {!authToken && !minimal && (
        <button
          className="nav-button"
          onClick={handleClick}
          disabled={showModal}
        >
          Log in
        </button>
      )}
    </nav>
  );
};

export default Nav;
