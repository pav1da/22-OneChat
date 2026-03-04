import { Button } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const AiPanel = ({ show, handleClose }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="kanit-regular ai-panel">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
        <p className="mb-0 fs-4 py-1 px-3 text-brand">
          <i className="bi bi-circle"></i> &nbsp; AI Assistant
        </p>
        <Button
          variant="none"
          onClick={handleClose}
          className="border-0"
          aria-label="Close AI Panel"
        >
          <i className="bi bi-x-lg" style={{ fontSize: "1.2rem" }}></i>
        </Button>
      </div>

      <div
        className="p-3 flex-grow-1"
        style={{
          overflowY: "auto",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <p className="text-center fs-3 mt-4">มีอะไรให้ฉันช่วยไหม</p>
      </div>

      <div className="p-3 d-flex align-items-center">
        <i className="bi bi-plus fs-3 mx-2"></i>
        <i className="bi bi-mic fs-4 mx-2"></i>
        <input
          type="text"
          className="form-control rounded-5 py-3 ps-4 mx-2"
          placeholder="Ask the AI a question..."
        />
      </div>
    </div>
  );
};

export default AiPanel;
