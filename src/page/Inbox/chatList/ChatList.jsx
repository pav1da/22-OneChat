import "./chatList.css";
import { Card, Badge } from "react-bootstrap";
import { fetchCustomer } from "../../../data/customer";
import { useEffect, useState } from "react";

const ChatList = () => {
  const [customer, setCustomer] = useState([]);

  const Status = (id) => {
    setCustomer((prev) =>
      prev.map((c) => (c.id === id ? { ...c, inprocess: !c.inprocess } : c))
    );
  };

  useEffect(() => {
    setCustomer(fetchCustomer());
  }, []);

  return (
    <div className="overflow-y-auto flex-grow-1 pt-3">
      {customer.map((cus) => {
        return (
          <Card className="custom-card-chat">
            <Card.Body className="d-flex align-items-center gap-3" key={cus.id}>
              {/* Profile Picture */}
              <img
                src={cus.img}
                className="rounded-circle"
                style={{ width: "60px", height: "60px", objectFit: "cover" }}
              />
              {/* Texts */}
              <div
                className="d-flex flex-column gap-1"
                style={{ height: "50px" }}
              >
                <div className="d-flex gap-3">
                  {/* Username */}
                  <span style={{ fontSize: "18px" }}>{cus.name}</span>
                  {/* Status */}
                  {cus.inprocess ? (
                    <Badge className="bg-warning custom-badge">
                      กำลังดำเนินการ
                    </Badge>
                  ) : (
                    <Badge className="bg-success custom-badge">เสร็จสิ้น</Badge>
                  )}
                </div>
                {/* Massage */}
                <p className="custom-text">{cus.last}</p>
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
};

export default ChatList;
