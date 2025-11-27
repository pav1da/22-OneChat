const customers = [
  {
    id: 1,
    name: "Asaba Harumasa",
    img: "./src/assets/Image/Customers/Harumasa.png",
    inprocess: true,
    last: "ยืนยันยอดชำระ ขอบคุณมากนะคะ 😊"
  },
  {
    id: 2,
    name: "Nelliel",
    img: "./src/assets/Image/Customers/Nelliel.png",
    inprocess: true,
    last: "ได้รับยอดเรียบร้อยค่ะ ขอบพระคุณมากนะคะ 🙏"
  },
  {
    id: 3,
    name: "Jane Doe",
    img: "./src/assets/Image/Customers/JaneDoe.png",
    inprocess: true,
    last: "ได้ค่ะ ขอบคุณมากๆค่า"
  },
  {
    id: 4,
    name: "Rin",
    img: "./src/assets/Image/Customers/Rin.png",
    inprocess: false, 
    last: "รับทราบค่ะ 😊 เราจะจัดเตรียมช่อ + การ์ดไว้ให้เรียบร้อย ชื่อคุณแป้งรับสินค้าเวลา 17.30 น. นะคะ"
  },
  {
    id: 5,
    name: "Kuchiki Rukia",
    img: "./src/assets/Image/Customers/KuchikiRukia.png",
    inprocess: false, 
    last: "ระเบิดลงแล้ว!"
  },
  {
    id: 6,
    name: "Ichigo",
    img: "./src/assets/Image/Customers/Ichigo.png",
    inprocess: true,
    last: "ได้ครับ ขอบคุณครับ"
  },
  {
    id: 7,
    name: "Jinx",
    img: "./src/assets/Image/Customers/Jinx.png",
    inprocess: false, 
    last: " "
  },
];

const fetchCustomer = () => {
  return customers.slice(0, 200);
};

export { fetchCustomer };
