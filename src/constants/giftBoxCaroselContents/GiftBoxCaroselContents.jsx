import familyPack from "../../assets/giftBox/familyPack.png";


const familyPackTitle = (
    <div className="title">
        <h1>Family Pack&nbsp;</h1>
        <h1>Gift Box</h1>
    </div>
)
const mensPackTitle = (
    <div className="title">
        <h1>Men's Pack&nbsp;</h1>
        <h1>Gift Box</h1>
    </div>
)
const womensPackTitle = (
    <div className="title">
        <h1>Women's Pack&nbsp;</h1>
        <h1>Gift Box</h1>
    </div>
)
const childrensPackTitle = (
    <div className="title">
        <h1>Children's Pack&nbsp;</h1>
        <h1>Gift Box</h1>
    </div>
)

export const giftBoxCaroselContents = [
  {
    id: 1,
    image: familyPack,
    imageAltText: "family pack",
    title: familyPackTitle,
    description:
      "Perfect for family celebrations — this pack comes loaded with colorful crackers, sparklers, and exciting combos to light up your Diwali!",
    points: [
      " 25+ assorted items inside",
      " Safe, colorful & festive",
      "Best for families & gifting",
      "Huge savings on MRP",
    ],
    finalPrice: "₹1500.00",
    comparePrice: "₹ 4000.00",
    discountPercentage: "Save 60%",
    buttonText: "Buy Now",
  },
  {
    id: 2,
    image: familyPack,
    imageAltText: "mens pack",
    title: mensPackTitle,
    description:
      "Perfect for family celebrations — this pack comes loaded with colorful crackers, sparklers, and exciting combos to light up your Diwali!",
    points: [
      " 25+ assorted items inside",
      " Safe, colorful & festive",
      "Best for families & gifting",
      "Huge savings on MRP",
    ],
    finalPrice: "₹15000.00",
    comparePrice: "₹ 40000.00",
    discountPercentage: "Save 50%",
    buttonText: "Buy Now",
  },
  {
    id: 3,
    image: familyPack,
    imageAltText: "women pack",
    title: womensPackTitle,
    description:
      "Perfect for family celebrations — this pack comes loaded with colorful crackers, sparklers, and exciting combos to light up your Diwali!",
    points: [
      " 25+ assorted items inside",
      " Safe, colorful & festive",
      "Best for families & gifting",
      "Huge savings on MRP",
    ],
    finalPrice: "₹10000.00",
    comparePrice: "₹ 40000.00",
    discountPercentage: "Save 70%",
    buttonText: "Buy Now",
  },
  {
    id: 4,
    image: familyPack,
    imageAltText: "children pack",
    title: childrensPackTitle,
    description:
      "Perfect for family celebrations — this pack comes loaded with colorful crackers, sparklers, and exciting combos to light up your Diwali!",
    points: [
      " 25+ assorted items inside",
      " Safe, colorful & festive",
      "Best for families & gifting",
      "Huge savings on MRP",
    ],
    finalPrice: "₹1000.00",
    comparePrice: "₹ 3000.00",
    discountPercentage: "Save 80%",
    buttonText: "Buy Now",
  },
];
