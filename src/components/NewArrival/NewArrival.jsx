import { useEffect, useState } from "react";
import "./newArrival.scss";
import productData from "../../data/prodcts";
import TabButton from "../UiCompnents/TabButton/TabButton";
import ProductCard from "../UiCompnents/ProductCard/ProductCard";
import CommonButton from "../UiCompnents/CommonButton/CommonButton";
const NewArrival = () => {
  const [productList, setProductList] = useState([]);
  const [activeTab, setActiveTab] = useState("All"); // ✅ Track active tab
  const [visibleCount, setVisibleCount] = useState(6);
  useEffect(() => {
    const storedProduct = localStorage.getItem("products");
    if (!storedProduct) {
      localStorage.setItem("products", JSON.stringify(productData));
      setProductList(productData);
    } else {
      setProductList(JSON.parse(storedProduct));
    }
  }, []);

  console.log(productList, "productList");

  const allTypes = productList
    ? ["All", ...new Set(productList.map((item) => item.type))]
    : [];

  const handleTabClick = (tabName) => {
    setActiveTab(tabName); // ✅ Set active tab when clicked
  };

  const filteredProducts =
    activeTab === "All"
      ? productList
      : productList.filter((item) => item.type === activeTab);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const handleViewMore = () => {
    setVisibleCount((prev) => prev + 6); // ✅ Load next 6 items
  };

  return (
    <>
      <div className="newArrival">
        <div className="containerLocal newArrivalContainer">
          <div className="topSection">
            <div className="titleContainer">
              <div className="title">
                <h1>Fresh From the Factory – </h1>
                <h1> &nbsp;New Arrivals</h1>
              </div>
              <p>
                Be the first to grab the latest and most exciting crackers of
                the season. Bright, safe, and guaranteed to light up your
                Diwali!
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
              <div className="cardSection">
                {visibleProducts.map((item) => (
                  <ProductCard
                    id={item.id}
                    image={item.image}
                    name={item.name}
                    packageContent={item.package_contents}
                    isNewArrival={item.new_arrival}
                    currentPrize={item.current_price}
                    oldPrize={item.old_price}
                    discount={item.discount}
                  />
                ))}
              </div>
            </div>
          </div>
          {visibleCount < filteredProducts.length && (
            <div className="viewMoreButton" onClick={handleViewMore}>
              <CommonButton buttonText="View More" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NewArrival;
