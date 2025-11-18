const customers = [
  {
    name: "Asaba Harumasa",
    img: "./src/assets/Image/Harumasa.png",
    status: "On-Going",
  },
  {
    name: "Jane Doe",
    img: "./src/assets/Image/JaneDoe.png",
    status: "Completed",
  },
];

const fetchCustomer = () => {
  return customers.slice(0, 200);
};

export { fetchCustomer };
