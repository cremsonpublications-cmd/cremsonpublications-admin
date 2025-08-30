import FavIcon from "../SvgComponents/FavIcon/FavIcon";

import { navLinks } from "../../constants/navHeaderContent";

import logo from "../../assets/imageComponents/whiteLogo.svg";
import cart from "../../assets/imageComponents/cart.svg";

import "./navHeader.scss"
import useScreenMobile from "../../hooks/UseScreenMobile";
const NavHeader = () => {
    const isMobile = useScreenMobile({size: 992});
  return (
    <>
      <section className="navHeader">
        <div className="containerLocal navHeaderContainer">
          <div className="logo">
            <div className="imageWrapper">
              <img src={logo} alt="logo" />
            </div>
          </div>
          {!isMobile &&<div className="navContainer">
            {navLinks.map((item) => (
              <span key={item.id}>{item.displayName}</span>
            ))}
          </div>}
          <div className="actions">
            <div className="favIcon">
              <FavIcon />
            </div>
            <div className="cartIcon">
              <img src={cart} alt="cart" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default NavHeader;
