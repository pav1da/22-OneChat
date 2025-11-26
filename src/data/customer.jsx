const customers = [
  {
    id: 1,
    name: "Harumasa",
    img: "./src/assets/Image/Customers/Harumasa.png",
    inprocess: true,
    last: "บริการโคตรห่วย"
  },
  {
    id: 2,
    name: "Nelliel",
    img: "./src/assets/Image/Customers/JaneDoe.png",
    inprocess: true,
    last: "ดีมากเลยค่ะ ของไม่เสียหายเลย"
  },
  {
    id: 3,
    name: "Jane Doe",
    img: "./src/assets/Image/Customers/Rin.png",
    inprocess: true,
    last: "สนใจสินค้าตัวนี้ครับ"
  },
  {
    id: 4,
    name: "Rin",
    img: "./src/assets/Image/Customers/KuchikiRukia.png",
    inprocess: false, 
    last: "ขอบคุณมากค่ะ ได้รับของแล้ว"
  },
  {
    id: 5,
    name: "Kuchiki Rukia",
    img: "./src/assets/Image/Customers/Jinx.png",
    inprocess: false, 
    last: "ระเบิดลงแล้ว!"
  },
  {
    id: 6,
    name: "Jinx",
    img: "./src/assets/Image/Customers/Ichigo.png",
    inprocess: false, 
    last: "โอเคครับ เดี๋ยวผมจัดการให้"
  },
  {
    id: 7,
    name: "Ichigo",
    img: "./src/assets/Image/Customers/Nelliel.png",
    inprocess: true,
    last: "สอบถามราคาหน่อยจ้า"
  }
];

const fetchCustomer = () => {
  return customers.slice(0, 200);
};

export { fetchCustomer };
