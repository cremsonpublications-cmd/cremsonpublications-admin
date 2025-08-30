import Marquee from "react-fast-marquee";
import { serviceSectionContents } from "../../constants/serviceContent";
import useScreenMobile from "../../hooks/UseScreenMobile";
import ServiceCard from "../UiCompnents/ServiceCard/ServiceCard";
import "./service.scss";

const Service = () => {
  const isMobile = useScreenMobile({ size: 1024 });

  return (
    <>
      <section className="service">
        <div className="containerLocal serviceContainer">
          {isMobile ? (
            <Marquee gradient={false} speed={50} pauseOnClick={true}>
              {serviceSectionContents.map((item) => (
                <div className="cardContainer">
                  <ServiceCard
                    id={item.id}
                    image={item.image}
                    title={item.title}
                    content={item.content}
                  />
                </div>
              ))}
            </Marquee>
          ) : (
            serviceSectionContents.map((item) => (
              <ServiceCard
                id={item.id}
                image={item.image}
                title={item.title}
                content={item.content}
              />
            ))
          )}
        </div>
      </section>
    </>
  );
};

export default Service;
