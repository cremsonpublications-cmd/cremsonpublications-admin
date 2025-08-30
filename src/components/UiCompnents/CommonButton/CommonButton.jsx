import "./commonButton.scss";

const CommonButton = ({ buttonText = "Buy Now", styleClass = "orangeXl" }) => {
  return <button className={styleClass}>{buttonText}</button>;
};

export default CommonButton;
