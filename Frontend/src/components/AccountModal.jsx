import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function AccountModal({ show, onHide }) {
  const navigate = useNavigate();

  const handleHaveAccount = () => {
    onHide();
    navigate("/signin");
  };

  const handleNoAccount = () => {
    onHide();
    navigate("/signup");
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton style={{ border: "none", paddingBottom: 0 }}>
        <Modal.Title className="w-100 text-center fw-bold" style={{ fontSize: "1.5rem" }}>
          ยินดีต้อนรับสู่ ONE CHAT
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center py-4">
        <p className="text-muted mb-4" style={{ fontSize: "1rem" }}>
          คุณมีบัญชีผู้ใช้งานหรือยัง?
        </p>
        <div className="d-grid gap-3">
          <Button
            variant="dark"
            size="lg"
            onClick={handleHaveAccount}
            className="fw-bold"
            style={{
              backgroundColor: "#2c3e50",
              borderColor: "#2c3e50",
              borderRadius: "8px",
            }}
          >
            มีบัญชีแล้ว - เข้าสู่ระบบ
          </Button>
          <Button
            variant="outline-dark"
            size="lg"
            onClick={handleNoAccount}
            className="fw-bold"
            style={{
              borderRadius: "8px",
              borderWidth: "2px",
            }}
          >
            ยังไม่มีบัญชี - สมัครสมาชิก
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default AccountModal;
