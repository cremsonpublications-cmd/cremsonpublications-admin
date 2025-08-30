import "./commonButton.scss";

const CommonButton = ({ buttonText = "Buy Now", styleClass = "orangeXl",onClick }) => {
  return <button className={styleClass} onClick={onClick}>{buttonText}</button>;
};

export default CommonButton;
