import Marquee from "react-fast-marquee";

import useScreenMobile from "../../hooks/UseScreenMobile";

import clock from "../../assets/imageComponents/clock.svg";
import phone from "../../assets/imageComponents/phone.svg";

import "./adHeader.scss";

const AdHeader = ({ shippingData }) => {
  const isMobile = useScreenMobile({ size: 992 });
  return (
    <>
      <section className="addHeader">
        {isMobile ? (
          <Marquee speed={50} gradient={false} pauseOnClick>
            <div className="container addHeaderContainer">
              <div className="shippingDetails">{shippingData}</div>
              <div className="contactContainer">
                <div className="phoneNumber">
                  <div className="imageWrapper">
                    <img src={clock} alt="clock" />
                  </div>
                  <span>+91 92207 75290</span>
                </div>
                <div className="officeHours">
                  <div className="imageWrapper">
                    <img src={phone} alt="phone" />
                  </div>
                  <span>Office Hours: 10AM - 8PM</span>
                </div>
              </div>
            </div>
          </Marquee>
        ) : (
          <div className="container addHeaderContainer">
            <div className="shippingDetails">{shippingData}</div>
            <div className="contactContainer">
              <div className="phoneNumber">
                <div className="imageWrapper">
                  <img src={clock} alt="clock" />
                </div>
                <span>+91 92207 75290</span>
              </div>
              <div className="officeHours">
                <div className="imageWrapper">
                  <img src={phone} alt="phone" />
                </div>
                <span>Office Hours: 10AM - 8PM</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default AdHeader;
