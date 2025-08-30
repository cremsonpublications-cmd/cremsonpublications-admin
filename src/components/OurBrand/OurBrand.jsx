import Marquee from "react-fast-marquee";
import { ourBrandImageList } from "../../constants/ourBrand";
import useScreenMobile from "../../hooks/UseScreenMobile";

import "./ourBrand.scss";

const OurBrand = () => {
  const isMobile = useScreenMobile({ size: 992 });
  return (
    <>
      <section className="ourBrand">
        <div className="container ourBrandContainer">
          <h1>Our Brands</h1>
          <div className="brandContainer">
            {isMobile ? (
              <Marquee gradient={false} speed={50} pauseOnClick={true}>
                {ourBrandImageList.map((item) => (
                  <div className="imageWrapper" key={item.id}>
                    <img src={item.image} alt={item.altText} />
                  </div>
                ))}
              </Marquee>
            ) : (
              ourBrandImageList.map((item) => (
                <div className="imageWrapper" key={item.id}>
                  <img src={item.image} alt={item.altText} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default OurBrand;
