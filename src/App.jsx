import { Routes, Route } from "react-router-dom";

import NavHeader from "./components/NavHeader/NavHeader";
import AdHeader from "./components/AdHeader/AdHeader";

import { adHeaderSectionDetailsContent } from "./constants/adHeaderContent";

import Home from "./pages/Home/Home";

import "/src/styles/global.scss";

function App() {
  return (
    <>
      <AdHeader shippingData={adHeaderSectionDetailsContent} />
      <NavHeader />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;
