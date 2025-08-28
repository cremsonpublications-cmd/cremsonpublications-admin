import "./footer.scss";
import {
  addressData,
  bankDetails,
  emailContact,
  footerContact,
  helpLinks,
  quickLinks,
} from "../../constants/footerContent";
import whiteLogo from "../../assets/imageComponents/whiteLogo.svg";
import facebook from "../../assets/footerSocialMedia/facebook.svg";
import ig from "../../assets/footerSocialMedia/ig.svg";
import linkedin from "../../assets/footerSocialMedia/linkedin.svg";
import x from "../../assets/footerSocialMedia/x.svg";
const Footer = () => {
  return (
    <>
      <section className="footer">
        <div className="container footerContainer">
          <div className="mainFooter">
            <div className="addressContainer">
              <div className="logo">
                <div className="imageWrapper">
                  <img src={whiteLogo} alt="whiteLogo" />
                </div>
              </div>
              <div className="addressDetail">
                <h3>{addressData.title}</h3>
                <div className="details">
                  {addressData.addressContent.map((item, index) => (
                    <span key={index}>{item}</span>
                  ))}
                </div>
              </div>
              <div className="contactDetails">
                {footerContact.map((item) => (
                  <div className="contactItem">
                    <span className="title">{item.title}</span>
                    <span className="content">{item.content}</span>
                  </div>
                ))}
              </div>
              <div className="email">
                <span>{emailContact.title}</span>
                <span>{emailContact.content}</span>
              </div>
            </div>
            <div className="navContainer">
              <div className="linkContainer">
                <h4>{quickLinks.title}</h4>
                <div className="linksItemContainer">
                  {quickLinks.link.map((item) => (
                    <span key={item.id}>{item.displayName}</span>
                  ))}
                </div>
              </div>
              <div className="bankDetailContainer">
                <h4>{bankDetails.title}</h4>
                <div className="bankDetailItemContainer">
                  {bankDetails.data.map((item, index) => (
                    <span key={index}>{item}</span>
                  ))}
                </div>
              </div>
              <div className="helpContainer">
                <h4>{helpLinks.title}</h4>
                <div className="helptemContainer">
                  {helpLinks.links.map((item) => (
                    <span key={item.id}>{item.displayName}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bottomFooter">
            <p>Copyrights © 2025 Slaldesigns</p>
            <div className="socialMediaContainer">
              <div className="item">
                <img src={facebook} alt="facebook" />
              </div>
              <div className="item">
                <img src={ig} alt="instagram" />
              </div>
              <div className="item">
                <img src={linkedin} alt="linkedin" />
              </div>
              <div className="item">
                <img src={x} alt="x" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Footer;
