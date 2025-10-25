import { Outlet } from "react-router-dom";
import Header from "./Header";

const Layouts = () => {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

export default Layouts;
