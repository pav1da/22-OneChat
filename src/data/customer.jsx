const customers = [
  {
    id: 1,
    name: "Asaba Harumasa",
    img: "./src/assets/Image/Customers/Harumasa.png",
    inprocess: true,
    last: "สนใจสินค้าตัวนี้ครับ"
  },
  {
    id: 2,
    name: "Nelliel",
    img: "./src/assets/Image/Customers/Nelliel.png",
    inprocess: true,
    last: "อยากได้แบบนั้นค่ะ"
  },
  {
    id: 3,
    name: "Jane Doe",
    img: "./src/assets/Image/Customers/JaneDoe.png",
    inprocess: true,
    last: "โอนแล้วอย่าลืมส่งสลิปด้วยนะคะ"
  },
  {
    id: 4,
    name: "Rin",
    img: "./src/assets/Image/Customers/Rin.png",
    inprocess: false, 
    last: "ขอบคุณมากค่ะ ได้รับของแล้ว"
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
    last: "สอบถามราคาหน่อยจ้า"
  },
  {
    id: 7,
    name: "Jinx",
    img: "./src/assets/Image/Customers/Jinx.png",
    inprocess: false, 
    last: "ดีมากเลยค่ะ ของไม่เสียหายเลย"
  },
];

const fetchCustomer = () => {
  return customers.slice(0, 200);
};

export { fetchCustomer };
