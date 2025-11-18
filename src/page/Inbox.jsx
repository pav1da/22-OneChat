import React, { useRef, useEffect } from "react";
import { Button, Form } from "react-bootstrap";

const Inbox = () => {
  const msgRef = useRef(null);

  useEffect(() => {
    // set initial height if there's content
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
    <div className="kanit-regular">
      <div className="d-flex gap-2">
        <Button variant="secondary" className="rounded-circle">
          <i className="bi bi-arrow-left"></i>
        </Button>
        <div className="w-100 rounded-5 bg-white align-content-center p-2 ps-4 fs-5">
          Dew Flower Shop
        </div>
      </div>

      <div className="d-flex gap-2 mt-3">
        <div className="w-50 bg-white rounded-4 p-3">
          <div className="d-flex gap-2">
            <Form.Control type="text" placeholder="ค้นหาหรือเริ่มการสนทนา" />
          </div>
          <div></div>
        </div>

        <div className="w-100 bg-white rounded-4 p-3">
          {/* Chat Header */}
          <div className="d-flex gap-3 align-items-center">
            {/*   Profile */}
            <img
              src="./src/assets/Image/Harumasa.png"
              alt="Cus-Profile"
              className="rounded-circle"
              style={{ width: "50px", height: "50px", objectFit: "cover" }}
            />
            {/* User Name */}
            <p className="fs-5">Asaba Harumasa</p>
          </div>

          <hr />
          <div
            style={{
              height: "700px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "10px" }}>
              {/* ข้อความแชทจะไปอยู่ตรงนี้ */}
            </div>

            <div className="bg-light rounded-3 p-3">
              <div className="d-flex flex-column">
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="พิมพ์ข้อความ"
                  ref={msgRef}
                  onInput={autoResize}
                  className="form-control border-0 bg-transparent"
                  style={{
                    overflow: "hidden",
                    resize: "none",
                    minHeight: "40px",
                    maxHeight: "120px",
                  }}
                />
                <div className="d-flex mt-1">
                  <div className="left-icons me-2">
                    <Button variant="link" className="p-0 me-2 text-black">
                      <i className="bi bi-paperclip"></i>
                    </Button>
                    <Button variant="link" className="p-0 me-2 text-black">
                      <i className="bi bi-bookmark"></i>
                    </Button>
                    <Button variant="link" className="p-0 text-black">
                      <i className="bi bi-crop"></i>
                    </Button>
                    <Button variant="link" className="ms-2 text-black p-0">
                      <i className="bi bi-emoji-smile"></i>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-50 bg-white rounded-4 p-3 d-flex flex-column align-items-center">
            {/*   Profile */}
          <img
            src="./src/assets/Image/Harumasa.png"
            alt="Cus-Profile"
            className="rounded-circle mt-4"
            style={{ width: "150px", height: "150px", objectFit: "cover" }}
          />
           {/* User Name */}
          <p className="mt-4">Asaba Harumasa &nbsp;<i className="bi bi-pencil"></i></p>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
