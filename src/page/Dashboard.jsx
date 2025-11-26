import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

function Dashboard() {
  //Modals
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    
    <div className="main-content flex-grow-1 p-3 kanit-regular bg-white rounded-4">
      {/* Modal */}
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="bi bi-plus-lg">เขียนโน๊ตที่คุณต้องการสร้าง</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>เลือกผู้ใช้</Form.Label>
              <Form.Control type="email" autoFocus />
            </Form.Group>
            <Form.Group
              className="mb-3"
              controlId="exampleForm.ControlTextarea1"
            >
              <Form.Label>Note</Form.Label>
              <Form.Control as="textarea" rows={3} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button style={{ background: "#000000ff" }} onClick={handleClose}>
            ปิด
          </Button>
          <Button style={{ background: "#F26623" }} onClick={handleClose}>
            บันทึก
          </Button>
        </Modal.Footer>
      </Modal>

      <Navbar expand="lg">
        <Container fluid>
          <Navbar.Brand style={{ color: "#F26623" }} className="fs-3" href="#">
            NOTE
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav
              className="me-auto my-2 my-lg-0"
              style={{ maxHeight: "100px" }}
              navbarScroll
            ></Nav>

            <div className="d-flex gap-3">
              <Form className="w-100">
                <Form.Control
                  type="search"
                  placeholder="Search"
                  className="me-2"
                  aria-label="Search"
                />
              </Form>
              <Button className="w-100" variant="outline-dark light">
                <i class="bi bi-arrow-down-up"></i>
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
                <i class="bi bi-plus"></i>
                สร้างโน้ต
              </button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <hr />
      <Container>
        <Row>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
        </Row>
        <Row>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
        </Row>
        <Row>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
        </Row>
        <Row>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
        </Row>
        <Row>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
        </Row>
        <Row>
         <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
        </Row>
        <Row>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
        </Row>
        <Row>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
        </Row>
        <Row>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
          <Col className="p-5"></Col>
        </Row>
      </Container>
    </div>
  );
}

export default Dashboard;
