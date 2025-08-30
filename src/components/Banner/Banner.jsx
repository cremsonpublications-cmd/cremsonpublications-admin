import "./banner.scss";
import banner from "../../assets/banner/banner.png"
const Banner = () => {
  return (
    <>
      <section className="banner">
        <div className="container bannerContainer">
            <div className="imageWrapper">
                <img src={banner} alt="Banner" />
            </div>
            <button className="bannerButton" ></button>
        </div>
      </section>
    </>
  );
};

export default Banner;
