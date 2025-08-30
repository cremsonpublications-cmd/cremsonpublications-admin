import "./tabButton.scss";

const TabButton = ({ tabText = "text", key,onClick,active=false }) => {
  return (
    <>
      <button key={key} className={`tabButton ${active ? "tabButtonactive":""}`} onClick={onClick}>{tabText}</button>
    </>
  );
};

export default TabButton;
