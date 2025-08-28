import AdHeader from "../../components/AdHeader/AdHeader";
import { adHeaderSectionDetailsContent } from "../../constants/adHeaderContent";

import "./home.scss";
const Home = () => {
  return (
    <>
      <AdHeader shippingData={adHeaderSectionDetailsContent}/>
    </>
  );
};

export default Home;
