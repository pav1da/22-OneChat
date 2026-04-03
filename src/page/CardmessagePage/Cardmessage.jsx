import React, { useState } from "react";
import { Container, Button, Form, Col, Row , Dropdown } from "react-bootstrap";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Cardmessage.css";

const Cardmessage = () => {
    const [search, setSearch] = useState("");
    const [show, setShow] = useState(false);
    const [items, setItems] = useState([

        {
            id: "C001",
            type: "รูปภาพ",
            title: "ช่อวัน Congrats",
            created: "25/7/2025 17:32",
            image: "src/assets/Image/Customers/Harumasa.png",
            message: ""
        },
        {
            id: "M001",
            type: "ข้อความ",
            title: "วิธีสั่งซื้อ",
            created: "20/7/2025 13:02",
            image: "",
            message: "1. เลือกแบบที่ต้องการ"
        },
    ]);

    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);


    const filteredItems = items.filter(
        (item) =>
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.type.toLowerCase().includes(search.toLowerCase())
    );


    return (<div className="main-content flex-grow-1 p-3 kanit-regular bg-white rounded-4">
        {/* หัวข้อ */}
        <Navbar expand="lg">
            <Container fluid>
                <Navbar.Brand style={{ color: "#F26623" }} className="fs-3" href="#">
                    Card Message
                </Navbar.Brand>
            </Container>
        </Navbar>
        <p style={{ color: "#919191", marginTop: "10px", marginLeft: "15px" }} className="fs-6" href="#" >
            ข้อความ และข้อความในรูปแบบการ์ดที่รวมเนื้อหาต่างๆ เอาไว้ในที่เดียว <br />
            โดยจะเเสดงเนื้อหาผ่านข้อความหรือภาพสไลด์ ตามที่ผู้ใช้กดเลือกใช้ได้ทันที
        </p>


        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
            <Nav
                className="me-auto my-2 my-lg-0"
                style={{ maxHeight: "100px" }}
                navbarScroll
            ></Nav>
        </Navbar.Collapse>

        {/* หัวข้อเทมเพลต */}
        <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
            <div className="fs-6 fw-regular ms-3 ">
                เทมเพลตทั้งหมด
            </div>

            {/* กล่อง Search*/}
            <div className="d-flex gap-3">
                <Form className="w-100">
                    <Form.Control
                        type="search"
                        placeholder="Search"
                        className="me-2 "
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </Form>

                {/* ปุ่ม */}
                <Button className="w-100" variant="outline-dark light">
                    <i className="bi bi-arrow-down-up"></i>
                    เรียงลำดับ
                </Button>

                <button
                    style={{
                        background: "#F26623",
                        width: "100%",
                        borderRadius: "7px",
                        border: "0px",
                        color: "white",
                    }}
                    onClick={() => {
                        handleShow();
                    }}
                >
                    <i className="bi bi-plus"></i>
                    สร้าง
                </button>
            </div>
        </div>



        <hr />

        <Container fluid className=" p-0card-table-container">
  {/* หัวข้อ */}
  <Row className="card-table-header">
    <Col className="col-id">ID</Col>
    <Col className="col-item">รูป/ข้อความ</Col>
    <Col>ชื่อไอเทม</Col>
    <Col className="col-created">วันสร้าง</Col>
    <Col className="col-type">ประเภท</Col>
    <Col style={{ width: "40px" }}></Col> {/* สำหรับจุดสามจุด */}
  </Row>

  {/* ข้อมูล */}
  {filteredItems.map((item) => (
    <Row key={item.id} className="card-table-row">
      {/* ID */}
      <Col className="col-id">{item.id}</Col>

      {/* รูป/ข้อความ */}
      <Col className="col-item">
        {item.type === "รูปภาพ" && item.image ? (
          <img src={item.image} alt={item.title} className="item-image" />
        ) : (
          <span>{item.message}</span>
        )}
      </Col>

      {/* ชื่อไอเทม */}
      <Col>{item.title}</Col>

      {/* วันสร้าง */}
      <Col className="col-created">{item.created}</Col>

      {/* ประเภท */}
      <Col className="col-type">{item.type}</Col>

      {/* จุดสามจุด */}
      <Col style={{ width: "40px", textAlign: "center" }}>
        <Dropdown>
          <Dropdown.Toggle
            variant="link"
            id={`dropdown-${item.id}`}
            className="p-0 m-0 item-options"
          >
             <img
        src="src/assets/Icon/icon-dot-h.png"
        alt="options"
        style={{ width: "20px", height: "20px", cursor: "pointer" }}
      />
    </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item>แก้ไข</Dropdown.Item>
            <Dropdown.Item>ลบ</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Col>
    </Row>
  ))}
</Container>

    </div>

    );
}

export default Cardmessage;