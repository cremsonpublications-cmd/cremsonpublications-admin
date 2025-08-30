import "./countButton.scss";
import minus from "../../../assets/imageComponents/minus.svg";
import plus from "../../../assets/imageComponents/plus.svg";
import { useState } from "react";
const CountButton = () => {
  const [count, setCount] = useState(0);

  // Function to handle manual input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and empty string
    if (/^\d*$/.test(value)) {
      setCount(value === "" ? "" : parseInt(value, 10));
    }
  };

  // Function to increase count
  const increaseCount = () => {
    setCount((prev) => (prev === "" ? 1 : prev + 1));
  };

  // Function to decrease count (should not go below 1)
  const decreaseCount = () => {
    setCount((prev) => (prev > 1 ? prev - 1 : 1));
  };

  return (
    <>
      <div className="countButton">
        <div className="minus" onClick={decreaseCount}>
          <div className="imageWrapper">
            <img src={minus} alt="minus" />
          </div>
        </div>
        <div className="countInput">
          <input
            type="text"
            value={count}
            onChange={handleInputChange}
            onBlur={() => {
              if (count === "" || count < 1) setCount(1); // Reset if empty or invalid
            }}
          />
        </div>
        <div className="add" onClick={increaseCount}>
          <div className="imageWrapper">
            <img src={plus} alt="plus" />
          </div>
        </div>
      </div>
    </>
  );
};

export default CountButton;
