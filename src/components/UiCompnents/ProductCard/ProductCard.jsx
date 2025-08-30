import "./productCard.scss";
import productCardMainBackground from "../../../assets/imageComponents/productCardMainBackground.png";
import FavIcon from "../../SvgComponents/FavIcon/FavIcon";
import NewBadge from "../NewBadge/NewBadge";
import CountButton from "../CountButton/CountButton";
import CommonButton from "../CommonButton/CommonButton";
import { useState } from "react";
const ProductCard = ({
  id,
  image,
  name,
  packageContent,
  isNewArrival = false,
  currentPrize,
  oldPrize,
  discount
}) => {
  const [addedToCart, setAddedToCart] = useState(false); // ✅ Track state
  const handleAddToCart = () => {
    setAddedToCart(true); // ✅ Switch to CountButton
  };
  return (
    <>
      <div className="productCardContainer" key={id}>
        <div className="imageSection">
          <img
            src={productCardMainBackground}
            alt="background"
            className="imageSectionBackground"
          />
          <div className="imageWrapper">
            <img src={image} alt={name} />
          </div>
          <div className="favIcon">
            <FavIcon />
          </div>
          <div className="discountTag">
            <h4>{`${discount}%`}</h4>
            <p>OFF</p>
          </div>
        </div>
        <div className="dataSection">
          <div className="dataContainer">
            <div className="productDetail">
              <div className="title">
                <h4>{name}</h4>
                {isNewArrival && <NewBadge />}
              </div>

              <p>{packageContent[0]}</p>
            </div>
            <div className="priceContainer">
              <p className="currentPrize">
                <span className="rupee">₹&nbsp;</span>
                {currentPrize}
              </p>
              <span className="oldPrize">{`${oldPrize}.00`}</span>
            </div>
          </div>
          <div className="actionContainer">
            {addedToCart ? (
              <div className="countWrapper">
                <CountButton />
              </div>
            ) : (
              <div className="addButton">
                <CommonButton
                  buttonText="Add to Cart"
                  styleClass="orangeNormal"
                  onClick={handleAddToCart}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductCard;
