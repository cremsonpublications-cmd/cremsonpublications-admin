import "./serviceCard.scss";
import quality from "../../../assets/Services/quality.svg";
const ServiceCard = ({
  id = 1,
  image = quality,
  title = "High Quality",
  content = "Crafted from top materials",
}) => {
  return (
    <>
      <div className="serviceCardContainer" key={id}>
        <div className="imageWrapper">
          <img src={image} alt={title} />
        </div>
        <div className="contentContainer">
          <h5>{title}</h5>
          <p>{content}</p>
        </div>
      </div>
    </>
  );
};

export default ServiceCard;
