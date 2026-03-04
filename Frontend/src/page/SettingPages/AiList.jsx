import { useState } from 'react';
import { Form, Button, InputGroup, Modal, OverlayTrigger, Popover } from 'react-bootstrap'; // ✅ เพิ่ม OverlayTrigger, Popover
import { Search, PencilFill, ThreeDots, Trash } from 'react-bootstrap-icons'; // เพิ่ม icon Trash (ถังขยะ) เผื่อใช้

function AiList({ title, onBack }) {
    const [showModal, setShowModal] = useState(false);

    // ข้อมูลรายการ
    const [dataList, setDataList] = useState([
        { id: 1, question: "วิธีสั่งซื้อสินค้า", answer: "วิธีสั่งซื้อสินค้า\n1.เลือกแบบที่ต้องการ\n2.แจ้งวันเวลา..." },
        { id: 2, question: "ติดต่อร้านค้า", answer: "ติดต่อที่ Line: xxxx\nเบอร์โทร: 09xxxxxxx" }
    ]);

    // State รับค่าฟอร์ม
    const [newQuestion, setNewQuestion] = useState("");
    const [newAnswer, setNewAnswer] = useState("");

    // ✅ State ใหม่: เก็บ ID ของตัวที่กำลังแก้ไข (ถ้าเป็น null = โหมดสร้างใหม่)
    const [editId, setEditId] = useState(null);

    const handleClose = () => {
        setShowModal(false);
        setEditId(null); // รีเซ็ต ID เมื่อปิด
        setNewQuestion(""); // รีเซ็ตค่า
        setNewAnswer("");
    };

    // ✅ ฟังก์ชัน: เปิด Modal เพื่อ "สร้างใหม่"
    const handleCreateClick = () => {
        setEditId(null); // ระบุว่าเป็นโหมดสร้างใหม่
        setNewQuestion("");
        setNewAnswer("");
        setShowModal(true);
    };

    // ✅ ฟังก์ชัน: เปิด Modal เพื่อ "แก้ไข"
    const handleEditClick = (item) => {
        setEditId(item.id); // จำ ID ที่จะแก้
        setNewQuestion(item.question); // ดึงข้อมูลเก่ามาใส่ช่อง
        setNewAnswer(item.answer);
        setShowModal(true);
    };

    // ✅ ฟังก์ชัน: บันทึก (รวมทั้ง สร้างใหม่ และ แก้ไข)
    const handleSave = () => {
        if (!newQuestion || !newAnswer) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        if (editId) {
            // --- กรณีแก้ไข (Update) ---
            const updatedList = dataList.map((item) => {
                if (item.id === editId) {
                    return { ...item, question: newQuestion, answer: newAnswer };
                }
                return item;
            });
            setDataList(updatedList);
        } else {
            // --- กรณีสร้างใหม่ (Create) ---
            const newItem = {
                id: Date.now(),
                question: newQuestion,
                answer: newAnswer
            };
            setDataList([...dataList, newItem]);
        }

        handleClose(); // ปิดและเคลียร์ค่า
    };

    // ✅ ฟังก์ชัน: ลบรายการ
    const handleDelete = (idToDelete) => {
        const remainingItems = dataList.filter(item => item.id !== idToDelete);
        setDataList(remainingItems);
        // (OverlayTrigger จะปิดเองเมื่อเราคลิกที่อื่น หรือปุ่มหายไป)
    };

    const btnStyle = {
        backgroundColor: '#333', borderColor: '#333', borderRadius: '6px',
        padding: '6px 20px', fontSize: '0.9rem', fontWeight: '500'
    };

    return (
        <div className='pt-5' style={{padding:"150px"}} >
            <div className="mb-3 text-muted" style={{ cursor: 'pointer', fontSize: '0.9rem' }} onClick={onBack}>
                &lt; ย้อนกลับ
            </div>

            <div className="mb-4">
                <h5 className="mb-2 fw-bold" style={{ fontSize: '1.1rem' }}>{title}</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                    ตั้งค่า {title} สำหรับลูกค้าใหม่ที่ทักเข้ามา
                </p>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <InputGroup style={{ maxWidth: '400px' }}>
                    <InputGroup.Text className="bg-light border-end-0"><Search className="text-muted" /></InputGroup.Text>
                    <Form.Control placeholder="ค้นหาคำตอบ" className="bg-light border-start-0 ps-0" style={{ boxShadow: 'none' }} />
                </InputGroup>

                {/* ใช้ handleCreateClick แทน handleShow ตรงๆ */}
                <Button variant="dark" style={btnStyle} onClick={handleCreateClick}>
                    สร้างคำตอบใหม่
                </Button>
            </div>

            <div className="table-responsive">
                <div className="d-flex border-bottom pb-2 mb-2">
                    <div style={{ width: '40%', fontWeight: '600' }}>คำถาม</div>
                    <div style={{ width: '60%', fontWeight: '600' }}>คำตอบ</div>
                </div>

                {dataList.map((item) => (
                    <div key={item.id} className="d-flex py-3 border-bottom align-items-start">
                        <div style={{ width: '40%', paddingRight: '15px' }}>{item.question}</div>

                        <div style={{ width: '60%' }} className="d-flex justify-content-between align-items-start">
                            <div style={{ whiteSpace: 'pre-line', fontSize: '0.95rem' }}>{item.answer}</div>

                            <div className="d-flex gap-2 ms-2">
                                {/* ปุ่มแก้ไข (ดินสอ) */}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    style={{ backgroundColor: '#6c757d', border: 'none' }}
                                    onClick={() => handleEditClick(item)} // ✅ เรียกฟังก์ชันแก้ไข
                                >
                                    <PencilFill size={12} />
                                </Button>

                                {/* ปุ่ม Option (3 จุด) แบบ Popover */}
                                <OverlayTrigger
                                    trigger="click"
                                    rootClose // คลิกที่อื่นแล้วปิดเอง
                                    placement="bottom"
                                    overlay={
                                        <Popover id={`popover-${item.id}`}>
                                            <Popover.Body className="p-2">
                                                {/* เมนูลบ */}
                                                <div
                                                    className="text-danger d-flex align-items-center gap-2"
                                                    style={{ cursor: 'pointer', fontWeight: '500' }}
                                                    onClick={() => handleDelete(item.id)} // ✅ เรียกฟังก์ชันลบ
                                                >
                                                    <Trash size={14} /> ลบรายการ
                                                </div>
                                            </Popover.Body>
                                        </Popover>
                                    }
                                >
                                    <Button variant="secondary" size="sm" style={{ backgroundColor: '#6c757d', border: 'none' }}>
                                        <ThreeDots size={14} />
                                    </Button>
                                </OverlayTrigger>

                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal (ใช้ร่วมกันทั้ง สร้าง และ แก้ไข) */}
            <Modal show={showModal} onHide={handleClose} centered backdrop="static">
                <Modal.Header closeButton style={{ borderBottom: 'none' }}>
                    {/* เปลี่ยนชื่อหัวข้อตามโหมด */}
                    <Modal.Title style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                        {editId ? 'แก้ไขคำตอบ' : 'สร้างคำตอบใหม่'}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontWeight: '600' }}>คำถาม</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="ตัวอย่าง: วิธีการชำระเงิน"
                                autoFocus
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontWeight: '600' }}>คำตอบ</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                placeholder="ใส่รายละเอียดคำตอบ..."
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>

                <Modal.Footer style={{ borderTop: 'none', justifyContent: 'space-between' }}>
                    <Button variant="light" onClick={handleClose} style={{ border: '1px solid #ddd', minWidth: '100px' }}>
                        ยกเลิก
                    </Button>
                    <Button variant="dark" onClick={handleSave} style={{ minWidth: '100px', backgroundColor: '#333', border: 'none' }}>
                        บันทึก
                    </Button>
                </Modal.Footer>

            </Modal>

        </div>
    );
}

export default AiList;