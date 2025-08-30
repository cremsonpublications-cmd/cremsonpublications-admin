
import Banner from "../../components/Banner/Banner";
import GiftBoxCarousel from "../../components/GiftBoxCarousel/GiftBoxCarousel";
import NewArrival from "../../components/NewArrival/NewArrival";
import OurBrand from "../../components/OurBrand/OurBrand";
import Service from "../../components/Service/Service";
import "./home.scss";
const Home = () => {
  return (
    <>
    <Banner />
    <OurBrand />
    <NewArrival />
    <GiftBoxCarousel />
    <Service />
    </>
  );
};

export default Home;
