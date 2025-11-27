import { Button, Form, InputGroup, Container, Row, Col } from "react-bootstrap";
import { fetchCustomer } from "../../data/customer";

import "./allChat.css";

const AllChat = () => {
  const customers = fetchCustomer();
  const customerCount = customers.length;
  const colsPerRow = 4;

  const totalEmptyCells = 21;

  const UserCard = ({ customer }) => (
    <div
      className="border rounded-4 p-2 d-flex align-items-center justify-content-between shadow-sm user-card"
      style={{ minHeight: "100px" }}
    >
      <div className="d-flex align-items-center gap-3 py-1 px-3">
        <img
          src={customer.img}
          className="user-avatar rounded-circle"
          style={{ width: "70px", height: "70px" }}
        />
        <div>
          <div className="d-flex align-items-center gap-1">
            <p className="fs-5 mb-0">{customer.name}</p>
          </div>
          <p
            className="text-muted mb-0 small text-truncate fs-6"
            style={{ maxWidth: "250px" }}
          >
            {customer.last}
          </p>
        </div>
      </div>
    </div>
  );

  const EmptyCard = () => (
    <div
      className="empty-card border-dashed-light-gray rounded-4 p-4"
      style={{ minHeight: "100px" }}
    ></div>
  );

  return (
    <div className="kanit-regular d-flex flex-column mx-4 allChat">
      {/* Header Section */}
      <div className="d-flex justify-content-between">
        <div className="fs-3" style={{ color: "#f26623" }}>
          All
        </div>
        <div className="d-flex gap-3 align-items-center">
          {/* Search Input */}
          <InputGroup style={{ width: "250px" }}>
            <InputGroup.Text
              className="bg-white border-1 rounded-start-3 py-2 ps-3 pe-2"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderColor: "#c5c5c5"
              }}
            >
              <i className="bi bi-search text-muted"></i>
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="ค้นหา..."
              className="rounded-end-3 border-1 custom-search"
              aria-label="Search"
            />
          </InputGroup>

          {/* Sort Button */}
          <Button
            className="d-flex align-items-center gap-1 rounded-3 border-1 px-4 py-2"
            style={{
              background: "#ffffff",
              color: "#707070",
              borderColor: "#c5c5c5",
            }}
          >
            <i className="bi bi-arrow-down-up"></i>
            เรียงลำดับ
          </Button>
        </div>
      </div>
      <hr />

      <Container fluid className="px-0">
        <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
          <Row className="g-4">
            {customers.map((customer) => (
              <Col key={customer.id} lg={3} md={4} sm={6} xs={12}>
                <UserCard customer={customer} />
              </Col>
            ))}

            {Array.from({ length: totalEmptyCells }).map((_, index) => (
              <Col key={`empty-${index}`} lg={3} md={4} sm={6} xs={12}>
                <EmptyCard />
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default AllChat;
