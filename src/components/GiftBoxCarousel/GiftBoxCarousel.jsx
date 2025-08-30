import { Carousel } from "react-responsive-carousel";

import { giftBoxCaroselContents } from "../../constants/giftBoxCaroselContents/GiftBoxCaroselContents";

import greenTick from "../../assets/imageComponents/greenTick.svg";

import "./giftBoxCarousel.scss";
import CommonButton from "../UiCompnents/CommonButton/CommonButton";
const GiftBoxCarousel = () => {
  return (
    <>
      <section className="giftBoxyCarousel">
        <div className="container giftBoxyCarouselContainer">
          
            {giftBoxCaroselContents.map((item) => (
              <div className="giftBoxSildeContainer">
                <div className="imageSection">
                  <div className="imageWrapper">
                    <img src={item.image} alt={item.imageAltText} />
                  </div>
                </div>
                <div className="contentWrapper">
                  <div className="textContainer">
                    <div className="mainContent">
                      <div className="cardHeader">
                        {item.title}
                        <p>{item.description}</p>
                      </div>
                      <div className="pointContainer">
                        {item.points.map((item, index) => (
                          <div className="pointsItem" key={index}>
                            <div className="imageWrapper">
                              <img src={greenTick} alt="Check" />
                            </div>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="priceContainer">
                      <span>{item.finalPrice}</span>
                      <span>{item.comparePrice}</span>
                      <span>{item.discountPercentage}</span>
                    </div>
                  </div>
                  <div className="buttonContainer">
                    <CommonButton buttonText={item.buttonText} />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>
    </>
  );
};

export default GiftBoxCarousel;
