import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

function Dashboard() {
  return (
    <div>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container fluid>
          <Navbar.Brand style={{ color: "#F26623" }} href="#">
            Note
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
              >
                <i class="bi bi-plus"></i>
                สร้างโน้ต
              </button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <hr />
    </div>
  );
}

export default Dashboard;
