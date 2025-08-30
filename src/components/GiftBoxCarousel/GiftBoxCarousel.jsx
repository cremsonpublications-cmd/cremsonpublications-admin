import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

import { giftBoxCaroselContents } from "../../constants/giftBoxCaroselContents/GiftBoxCaroselContents";

import greenTick from "../../assets/imageComponents/greenTick.svg";

import "./giftBoxCarousel.scss";
import CommonButton from "../UiCompnents/CommonButton/CommonButton";
import ArrowIcon from "../SvgComponents/ArrowIcon/ArrowIcon";
const GiftBoxCarousel = () => {
  return (
    <>
      <section className="giftBoxCarousel">
        <div className="container giftBoxCarouselContainer">
          <Carousel
            showThumbs={false} // Hide thumbnails
            showStatus={false} // Hide status (e.g., 1/3)
            infiniteLoop={true} // Infinite looping
            autoPlay={true} // Auto slide
            interval={3000} // 3 seconds per slide
            stopOnHover={true} // Pause on hover
            swipeable={true} // Enable swipe for touch
            emulateTouch={true} // Mobile touch behavior
            className="giftBoxCarousel"
            renderArrowPrev={(onClickHandler, hasPrev, label) =>
              hasPrev && (
                <button
                  type="button"
                  onClick={onClickHandler}
                  className="customArrow customArrowPrev"
                  aria-label={label}
                >
                  <ArrowIcon fillColor="#fff" arrowColor="#FF6B00"/>
                </button>
              )
            }
            renderArrowNext={(onClickHandler, hasNext, label) =>
            hasNext && (
              <button
                type="button"
                onClick={onClickHandler}
                className="customArrow customArrowNext"
                aria-label={label}
              >
                {/* Rotate your icon for next arrow */}
                <div style={{ transform: "rotate(180deg)" }}>
                  <ArrowIcon fillColor="#FF6B00" arrowColor="#fff"/>
                </div>
              </button>
            )
          }
          >
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
          </Carousel>
        </div>
      </section>
    </>
  );
};

export default GiftBoxCarousel;
