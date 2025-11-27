import React from 'react';
import { Button } from 'react-bootstrap';
import "bootstrap-icons/font/bootstrap-icons.css";

const panelStyle = {
    // กำหนดให้ Panel ลอยอยู่เหนือองค์ประกอบอื่น
    position: 'fixed',
    top: '50%',
    right: '80px', // ตำแหน่งด้านขวาของจอ
    transform: 'translateY(-50%)', // จัดให้อยู่กึ่งกลางแนวตั้ง
    width: '400px',
    height: '600px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
    zIndex: 1050, // ให้อยู่เหนือ Dropdown หรือ Modal อื่นๆ
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
};

const AiPanel = ({ show, handleClose }) => {
    if (!show) {
        return null; // ถ้า show เป็น false จะไม่แสดง Component ใดๆ
    }

    return (
        <div className='kanit-regular' style={{...panelStyle, display: show ? 'flex' : 'none' }}>
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                <h5 className="mb-0">AI Assistant</h5>
                <Button 
                    variant="light" 
                    onClick={handleClose} 
                    className="p-0 border-0"
                    aria-label="Close AI Panel"
                >
                    <i className="bi bi-x-lg" style={{ fontSize: '1.2rem' }}></i>
                </Button>
            </div>

            {/* Body (เนื้อหา AI Chat) */}
            <div className="p-3 flex-grow-1" style={{ overflowY: 'auto' }}>
                <p>Welcome to your customized Floating AI Interface.</p>
                {/* ใส่เนื้อหา Chat Component หรือ UI ของ AI ตรงนี้ */}
            </div>

            <div className="p-3 border-top">
                <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ask the AI a question..." 
                />
            </div>
        </div>
    );
};

export default AiPanel;