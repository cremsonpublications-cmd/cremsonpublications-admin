import CommonButton from "../UiCompnents/CommonButton/CommonButton";
import "./categories.scss";
import categoriesData from "../../data/category";
import ProductCard from "../UiCompnents/ProductCard/ProductCard";
const Categories = () => {
  return (
    <>
      <div className="categories">
        <div className="containerLocal categoriesContainer">
          <div className="titleContainer">
            <h1>
              Shop by <span>Categories</span>
            </h1>
            <p>Find the perfect crackers for every celebration</p>
          </div>
          <div className="categoryCardsContainer">
            {categoriesData.map((item) => (
              <ProductCard
                name={item.name}
                image={item.image}
                id={item.id}
                discount={item.discount}
                isProductCard={false}
              />
            ))}
          </div>
          <div className="viewMoreButton">
            <CommonButton buttonText="View More" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Categories;
