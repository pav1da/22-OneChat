const customers = [
  {
    id: 1,
    name: "Asaba Harumasa",
    img: "./src/assets/Image/Customers/Harumasa.png",
    inprocess: false,
    last: "ยืนยันยอดชำระ ขอบคุณมากนะคะ 😊",
    app: "Facebook : Dew Flower Shop"
  },
  {
    id: 2,
    name: "Nelliel",
    img: "./src/assets/Image/Customers/Nelliel.png",
    inprocess: false,
    last: "ได้รับยอดเรียบร้อยค่ะ ขอบพระคุณมากนะคะ 🙏",
    app: "Line : Mod Dang Flower"
  },
  {
    id: 3,
    name: "Jane Doe",
    img: "./src/assets/Image/Customers/JaneDoe.png",
    inprocess: false,
    last: "ได้ค่ะ ขอบคุณมากๆค่า",
    app: "Facebook : Dew Flower Shop"
  },
  {
    id: 4,
    name: "Rin",
    img: "./src/assets/Image/Customers/Rin.png",
    inprocess: true, 
    last: "รับทราบค่ะ 😊 เราจะจัดเตรียมช่อ + การ์ดไว้ให้เรียบร้อย ชื่อคุณแป้งรับสินค้าเวลา 17.30 น. นะคะ",
    app: "Facebook : Dew Flower Shop"
  },
  {
    id: 5,
    name: "Kuchiki Rukia",
    img: "./src/assets/Image/Customers/KuchikiRukia.png",
    inprocess: false, 
    last: "ระเบิดลงแล้ว!",
    app: "Line : Seretei Flower"
  },
  {
    id: 6,
    name: "Ichigo",
    img: "./src/assets/Image/Customers/Ichigo.png",
    inprocess: true,
    last: "ได้ครับ ขอบคุณครับ",
    app: "Line : Seretei Flower"
  },
  {
    id: 7,
    name: "Jinx",
    img: "./src/assets/Image/Customers/Jinx.png",
    inprocess: null, 
    last: "สวัสดีค่ะ ต้องการสอบถามค่ะ",
    app: "Line : lala florist"
  },
  {
    id: 8,
    name: "Bell",
    img: "./src/assets/Image/Customers/bell.png",
    inprocess: false,
    last: "อร่อยมากค่าาา <3",
    app: "Line : Papaya Sap mak"
  },
  {
    id: 9,
    name: "Sen",
    img: "./src/assets/Image/Customers/sen.png",
    inprocess: true,
    last: "จัดส่งแล้วนะคะได้รับแล้วแจ้งแอดมินได้เลยค่ะ",
    app: "Facebook : Dew Flower Shop"
  },
  {
    id: 10,
    name: "Bank",
    img: "./src/assets/Image/Customers/bank.png",
    inprocess: null,
    last: "ที่ร้านมีดอกฮิกันบานะไหมคับ",
    app: "Facebook : Dew Flower Shop"
  }
];

const fetchCustomer = () => {
  return customers.slice(0, 200);
};

export { fetchCustomer };
