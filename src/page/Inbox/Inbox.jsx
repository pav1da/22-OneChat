import React, { useRef, useEffect } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
} from "react-bootstrap";
import "./inbox.css";

const Inbox = () => {
  const msgRef = useRef(null);

  useEffect(() => {
    if (msgRef.current) {
      msgRef.current.style.height = "auto";
      msgRef.current.style.height = msgRef.current.scrollHeight + "px";
    }
  }, []);

  const autoResize = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  return (
    <div className="kanit-regular h-100 d-flex flex-column">
      {/* Start Header Section*/}
      <div className="d-flex gap-2 mb-3">
        {/* Return Button */}
        <button className="btn-sm-circle">
          <i className="bi bi-arrow-left"></i>
        </button>
        {/* Title */}
        <div className="w-100 rounded-5 p-2 ps-4 d-flex align-items-center fs-5 bg-white-translucent">
          All Chats
        </div>
      </div>
      {/* End Header Section */}

      <div className="d-flex gap-2 mt-3 pb-3 flex-grow-1 h-100">
        {/* Start ChatList Section */}
        <div className="w-50 bg-white-translucent rounded-4 p-3 d-flex flex-column h-100">
          <div className="d-flex gap-2 flex-shrink-0">
            <Form.Control
              type="text"
              placeholder="ค้นหาหรือเริ่มการสนทนา"
              className="custom-search-input"
            />
          </div>
          <hr className="mt-2 mb-2" />
          {/* Chat List */}
          <div className="overflow-y-auto flex-grow-1">
            <Card>
              <Card.Body className="d-flex align-items-center gap-3">
                <img
                  src="./src/assets/Image/Customers/Harumasa.png"
                  className="rounded-circle"
                  style={{ width: "55px", height: "55px", objectFit: "cover" }}
                />
                <div className="w-75">
                  <div>Asaba Harumasa</div>
                  <Badge className="bg-warning p-1.5">On-Going</Badge>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
        {/* End ChatList Section */}

        {/* Start Chat Section */}
        <div className="w-100 bg-white-translucent rounded-4 p-3 d-flex flex-column h-100">
          {/* Chat Header */}
          <div className="d-flex gap-3 align-content-center align-items-center">
            {/* Profile */}
            <img
              src="./src/assets/Image/Customers/Harumasa.png"
              className="rounded-circle"
              style={{ width: "40px", height: "40px", objectFit: "cover" }}
            />
            {/* User Name */}
            <div className="fs-5">Asaba Harumasa</div>
          </div>
          <hr className="mt-2 mb-2" />

          {/* Chat container */}
          <div className="flex-grow-1 overflow-y-auto">
            {/* Date and Time */}
            <center>
              <p style={{ color: "#4E4E4E" }}>25 Dec 2060 02:45 pm</p>
            </center>
            {/* Customers Massage */}
            <div className="d-flex align-content-center align-items-center gap-2">
              <img
                src="./src/assets/Image/Customers/Harumasa.png"
                className="rounded-circle"
                style={{ width: "40px", height: "40px", objectFit: "cover" }}
              />
              <div
                className="align-self-start mb-2 p-3 rounded-4 w-auto"
                style={{ backgroundColor: "#707070", color: "white" }}
              >
                สวัสดีครับ ต้องการสั่งซื้อสินค้าครับ
              </div>
            </div>
            {/* Admin Massage */}
            <div className="d-flex align-content-center align-items-center gap-2 justify-content-end">
              <div
                className="align-self-end mb-2 p-3 rounded-4 w-auto"
                style={{ backgroundColor: "#EFB4AA", color: "black" }}
              >
                สวัสดีครับ
              </div>
              <img
                src="./src/assets/Image/Admins/pav1da.png"
                className="rounded-circle"
                style={{ width: "40px", height: "40px", objectFit: "cover" }}
              />
            </div>
          </div>

          {/* Text Section */}
          <div className="flex-shrink-0">
            <hr />
            <div className="d-flex flex-row chat-input-container p-1 ">
              {/* Emoji Button */}
              <Button variant="link" className="pt-1 pb-1 pe-1 text-black">
                <i
                  className="bi bi-emoji-smile fs-4"
                  style={{ lineHeight: 1 }}
                />
              </Button>

              {/* Text Area */}
              <Form.Control
                as="textarea"
                rows={1}
                placeholder="พิมพ์ข้อความ"
                ref={msgRef}
                onInput={autoResize}
                className="border-0 custom-search-input w-50 pt-2"
                style={{
                  overflow: "hidden",
                  resize: "none",
                  minHeight: "40px",
                  maxHeight: "120px",
                }}
              />
            </div>
          </div>
        </div>
        {/* End Chat Section */}

        {/* Start Profile Section */}
        <div className="w-50 bg-white-translucent align-items-center rounded-4 pt-3 d-flex flex-column h-100">
          {/* Profile */}
          <img
            src="./src/assets/Image/Customers/Harumasa.png"
            className="rounded-circle mt-5"
            style={{ width: "140px", height: "140px", objectFit: "cover" }}
          />
          {/* User Name */}
          <p className="mt-4">
            Asaba Harumasa &nbsp;<i className="bi bi-pencil"></i>
          </p>
          {/* ผู้รับผิดชอบ */}
          <div className="mt-5">
            <p>ผู้รับผิดชอบ : &nbsp;&nbsp;
            <img
              src="./src/assets/Image/Admins/pav1da.png"
              className="rounded-circle"
              style={{ width: "40px", height: "40px", objectFit: "cover" }}
            /> &nbsp; pav1da</p>
            <hr />
            {/* Note Section */}
            <div className="flex-grow-1 w-100 p-3">
                Note Section Content Here
            </div>
          </div>
        </div>
        {/* End Profile Section */}
      </div>
    </div>
  );
};

export default Inbox;
