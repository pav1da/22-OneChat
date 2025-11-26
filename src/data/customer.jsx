const customers = [
  {
    id: 1,
    name: "Harumasa",
    img: "./src/assets/Image/Customers/Harumasa.png",
    inprocess: true,
    last: "Hello World"
  },
  {
    id: 2,
    name: "Jane Doe",
    img: "./src/assets/Image/Customers/JaneDoe.png",
    inprocess: true,
    last: "Hello World"
  },
];

const fetchCustomer = () => {
  return customers.slice(0, 200);
};

export { fetchCustomer };
