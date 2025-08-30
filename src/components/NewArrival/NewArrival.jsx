import { useEffect, useState } from "react";
import "./newArrival.scss";
import productData from "../../data/prodcts.json";
import TabButton from "../UiCompnents/TabButton/TabButton";
const NewArrival = () => {
  const [productList, setProductList] = useState();
  const [activeTab, setActiveTab] = useState("All"); // ✅ Track active tab
  useEffect(() => {
    const storedProduct = localStorage.getItem("products");
    if (!storedProduct) {
      localStorage.setItem("products", JSON.stringify(productData));
      setProductList(productData);
    } else {
      setProductList(JSON.parse(storedProduct));
    }
  }, []);

  const allTypes = productList
    ? ["All", ...new Set(productList.map((item) => item.type))]
    : [];

  const handleTabClick = (tabName) => {
    setActiveTab(tabName); // ✅ Set active tab when clicked
  };

  console.log(allTypes);
  return (
    <>
      <div className="newArrival">
        <div className="container newArrivalContainer">
          <div className="titleContainer">
            <div className="title">
              <h1>Fresh From the Factory – </h1>
              <h1> &nbsp;New Arrivals</h1>
            </div>
            <p>
              Be the first to grab the latest and most exciting crackers of the
              season. Bright, safe, and guaranteed to light up your Diwali!
            </p>
          </div>
          <div className="productContainer">
            <div className="tabSection">
              {allTypes.map((item, index) => (
                <TabButton
                  tabText={item}
                  key={index}
                  active={activeTab === item}
                  onClick={() => handleTabClick(item)}
                />
              ))}
            </div>
            <div className="cardSection"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewArrival;
