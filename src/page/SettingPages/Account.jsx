import { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Form } from 'react-bootstrap';

function Account() {

    // ==================================================
    // 1. STATE MANAGEMENT
    // ==================================================

    // ข้อมูลผู้ใช้จำลอง
    const [userData, setUserData] = useState({
        username: 'pav1da',
        email: 'pav1da.onechat@email.com',
        phone: '089-999-6789',
        password: '',
    });

    // จัดการรูปภาพ
    const [imagePreview, setImagePreview] = useState("https://via.placeholder.com/150");
    const fileInputRef = useRef(null);

    // ควบคุมการเปิด-ปิด Modals
    const [showModal, setShowModal] = useState(false);              // Modal 1: กรอกข้อมูลหลัก
    const [showVerifyModal, setShowVerifyModal] = useState(false);  // Modal 3: ยืนยันอีเมล
    const [showEmailReasonModal, setShowEmailReasonModal] = useState(false); // Modal 2: ถามเหตุผล

    // ประเภทข้อมูลที่กำลังแก้ไข (username, email, phone, password)
    const [modalType, setModalType] = useState('');

    // ค่า Input ทั่วไป
    const [editValue, setEditValue] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // ค่า Input สำหรับเปลี่ยนรหัสผ่าน
    const [pwdCurrent, setPwdCurrent] = useState('');
    const [pwdNew, setPwdNew] = useState('');
    const [pwdConfirm, setPwdConfirm] = useState('');


    // ==================================================
    // 2. EFFECTS
    // ==================================================

    // ล้าง Memory รูปภาพเมื่อ Component ถูกทำลาย
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);


    // ==================================================
    // 3. FUNCTIONS & LOGIC
    // ==================================================

    // --- เปิด Modal และเตรียมข้อมูล ---
    const handleShowModal = (type) => {
        setModalType(type);

        // เติมข้อมูลเดิมลงใน Input
        if (type === 'username') setEditValue(userData.username);
        else if (type === 'email') setEditValue(userData.email);
        else if (type === 'phone') setEditValue('');

        // รีเซ็ตค่าอื่นๆ
        setEditValue('');
        setConfirmPassword('');
        setPwdCurrent('');
        setPwdNew('');
        setPwdConfirm('');

        setShowModal(true);
    };

    // --- ปิด Modal ---
    const handleCloseModal = () => setShowModal(false);
    const handleCloseVerifyModal = () => setShowVerifyModal(false);
    const handleCloseEmailReasonModal = () => setShowEmailReasonModal(false);

    // --- Flow Control: เมื่อกดปุ่ม "เสร็จสิ้น" / "ส่ง" ---
    const handleNextStep = () => {
        // ถ้าเป็นการแก้อีเมล ให้ไปหน้าถามเหตุผลก่อน
        if (modalType === 'email') {
            setShowModal(false);
            setTimeout(() => setShowEmailReasonModal(true), 200);
        } else {
            // กรณีอื่น บันทึกเลย
            saveDataAndClose();
        }
    };

    // --- Flow Control: จากหน้าถามเหตุผล -> ยืนยันอีเมล ---
    const handleEmailReasonNext = () => {
        setShowEmailReasonModal(false);
        setTimeout(() => setShowVerifyModal(true), 200);
    };

    // --- Flow Control: ยืนยันอีเมลเสร็จสิ้น ---
    const handleConfirmVerify = () => {
        saveDataAndClose();
        setShowVerifyModal(false);
    };

    // --- บันทึกข้อมูล ---
    const saveDataAndClose = () => {
        if (modalType !== 'password') {
            setUserData((prevData) => ({
                ...prevData,
                [modalType]: editValue || prevData[modalType]
            }));
        } else {
            console.log("Password Changed:", pwdNew);
        }
        setShowModal(false);
    };

    // --- จัดการรูปภาพ ---
    const handleEditClick = () => fileInputRef.current.click();

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        }
    };


    // ==================================================
    // 4. UI CONFIG & STYLES
    // ==================================================

    // เนื้อหาข้อความใน Modal
    const getModalContent = () => {
        switch (modalType) {
            case 'username':
                return {
                    title: 'เปลี่ยนชื่อผู้ใช้ของคุณ',
                    subtitle: 'ป้อนชื่อผู้ใช้ใหม่และรหัสผ่านที่มีของคุณ',
                    label1: 'ชื่อผู้ใช้',
                    helper: 'โปรดใช้เฉพาะตัวเลข, ตัวอักษร, ขีดล่าง _ , หรือจุดเท่านั้น', label2: 'รหัสผ่านปัจจุบัน'
                };
            case 'email':
                return {
                    title: 'เปลี่ยนอีเมลของคุณ',
                    subtitle: 'ป้อนอีเมลใหม่และรหัสผ่านเพื่อยืนยัน',
                    label1: 'อีเมล',
                    helper: '',
                    label2: 'รหัสผ่านปัจจุบัน'
                };
            case 'phone':
                return {
                    title: 'ใส่เบอร์โทรศัพท์',
                    subtitle: 'คุณจะได้รับข้อความพร้อมกับรหัสยืนยัน'
                };
            case 'password':
                return {
                    title: 'อัปเดตรหัสผ่านของคุณ',
                    subtitle: 'ป้อนรหัสผ่านปัจจุบันและรหัสผ่านใหม่'
                };
            default:
                return {
                    title: 'แก้ไขข้อมูล',
                    subtitle: '',
                    label1: 'ข้อมูล',
                    label2: 'รหัสผ่าน'
                };
        }
    };
    const modalContent = getModalContent();

    // Styles
    const cardSectionStyle = {
        backgroundColor: "#eceef0",
        borderRadius: "16px",
        padding: "30px",
        marginBottom: "24px",
        border: "none"
    };
    const btnDarkStyle = {
        backgroundColor: "#4a4a4a",
        border: "none",
        borderRadius: "8px",
        padding: "8px 24px",
        fontSize: "0.9rem",
        fontWeight: "500",
        minWidth: "100px"
    };
    const modalBtnCancel = {
        backgroundColor: "#fff",
        color: "#333",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "8px 24px",
        fontWeight: "500",
        width: "48%"
    };
    const modalBtnSave = {
        backgroundColor: "#4a4a4a",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "8px 24px",
        fontWeight: "500",
        width: "48%"
    };
    const modalBtnFullWidth = {
        backgroundColor: "#4a4a4a",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "10px 24px",
        fontWeight: "500",
        width: "100%"
    };


    // ==================================================
    // 5. RENDER (JSX)
    // ==================================================
    return (
        <Container fluid className="px-4 py-2" style={{ maxWidth: '1000px' }}>

            <h4 className="fw-bold mb-4">แก้ไขโปรไฟล์</h4>

            {/* -------------------------------------------------------
                SECTION 1: รูปโปรไฟล์
               ------------------------------------------------------- */}
            <div style={cardSectionStyle}>
                <Row className="align-items-center justify-content-between">
                    <Col xs="auto" className="d-flex align-items-center gap-4">
                        {/* Avatar Container */}
                        <div
                            style={{
                                width: "70px",
                                height: "70px",
                                borderRadius: "50%",
                                overflow: "hidden",
                                backgroundColor: "#ddd",
                                flexShrink: 0,
                            }}
                        >
                            {imagePreview && (
                                <img
                                    src={imagePreview}
                                    alt="Profile"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            )}
                        </div>
                        <span className="fw-bold fs-5">{userData.username}</span>
                    </Col>

                    <Col xs="auto">
                        <Button
                            variant="dark"
                            style={btnDarkStyle}
                            onClick={handleEditClick}
                        >
                            เปลี่ยนรูปภาพ
                        </Button>
                        {/* Hidden Input for File Upload */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            accept="image/*"
                        />
                    </Col>
                </Row>
            </div>

            {/* -------------------------------------------------------
                SECTION 2: ข้อมูลส่วนตัว (ชื่อ, อีเมล, เบอร์)
               ------------------------------------------------------- */}
            <div style={cardSectionStyle}>

                {/* Username Row */}
                <Row className="align-items-center justify-content-between mb-4">
                    <Col>
                        <div className="fw-bold mb-1" style={{ fontSize: '0.95rem' }}>ชื่อผู้ใช้</div>
                        <div style={{ fontSize: '1rem' }}>{userData.username}</div>
                    </Col>
                    <Col xs="auto">
                        <Button
                            variant="dark"
                            style={btnDarkStyle}
                            onClick={() => handleShowModal('username')}
                        >
                            แก้ไข
                        </Button>
                    </Col>
                </Row>

                {/* Email Row */}
                <Row className="align-items-center justify-content-between mb-4">
                    <Col>
                        <div className="fw-bold mb-1" style={{ fontSize: '0.95rem' }}>อีเมล</div>
                        <div style={{ fontSize: '1rem' }}>{userData.email}</div>
                    </Col>
                    <Col xs="auto">
                        <Button
                            variant="dark"
                            style={btnDarkStyle}
                            onClick={() => handleShowModal('email')}
                        >
                            แก้ไข
                        </Button>
                    </Col>
                </Row>

                {/* Phone Row */}
                <Row className="align-items-center justify-content-between">
                    <Col>
                        <div className="fw-bold mb-1" style={{ fontSize: '0.95rem' }}>เบอร์โทรศัพท์</div>
                        <div style={{ fontSize: '1rem' }}>{userData.phone}</div>
                    </Col>
                    <Col xs="auto" className="d-flex align-items-center gap-3">
                        <span className="text-muted small" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                            ลบ
                        </span>
                        <Button
                            variant="dark"
                            style={btnDarkStyle}
                            onClick={() => handleShowModal('phone')}
                        >
                            แก้ไข
                        </Button>
                    </Col>
                </Row>
            </div>

            <hr className="my-5" style={{ borderTop: '1px solid #3b3b3bff' }} />

            {/* -------------------------------------------------------
                SECTION 3: ความปลอดภัย (รหัสผ่าน, 2FA)
               ------------------------------------------------------- */}
            <div className="px-2">

                {/* Change Password Row */}
                <Row className="align-items-center justify-content-between mb-4">
                    <Col>
                        <div className="fw-medium" style={{ fontSize: '1rem' }}>รหัสผ่าน</div>
                    </Col>
                    <Col xs="auto">
                        <Button
                            variant="dark"
                            style={btnDarkStyle}
                            onClick={() => handleShowModal('password')}
                        >
                            เปลี่ยนรหัสผ่าน
                        </Button>
                    </Col>
                </Row>

                {/* 2FA Row */}
                <Row className="align-items-center justify-content-between">
                    <Col>
                        <div className="fw-medium" style={{ fontSize: '1rem' }}>
                            การยืนยันตัวตนสองขั้นตอน (2FA)
                        </div>
                    </Col>
                    <Col xs="auto">
                        <Button variant="dark" style={btnDarkStyle}>
                            เปิดใช้งาน 2FA
                        </Button>
                    </Col>
                </Row>
            </div>


            {/* =======================================================
                MODAL 1: หน้าต่างแก้ไขข้อมูลหลัก (Dynamic Content)
               ======================================================= */}
            <Modal
                show={showModal}
                onHide={handleCloseModal}
                centered
                backdrop="static"
                keyboard={false}
                size="lg"
                style={{ fontFamily: 'Prompt, sans-serif' }}
            >
                <Modal.Header closeButton style={{ borderBottom: 'none', padding: '24px 24px 0 24px' }}>
                    <Modal.Title style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                        {modalContent.title}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ padding: '0 24px 24px 24px' }}>
                    <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
                        {modalContent.subtitle}
                    </p>

                    {/* === CASE: Phone (เบอร์โทร) === */}
                    {modalType === 'phone' ? (
                        <Form>
                            <Row>
                                <Col xs={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{ fontWeight: '600', fontSize: '0.8rem' }}>
                                            รหัสประเทศ
                                        </Form.Label>
                                        <Form.Select
                                            style={{ borderRadius: '8px', padding: '10px' }}
                                            defaultValue="TH"
                                        >
                                            <option value="TH">TH ไทย</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col xs={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label style={{ fontWeight: '600', fontSize: '0.8rem' }}>
                                            เบอร์โทรศัพท์
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="+66"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            style={{ borderRadius: '8px', padding: '10px' }}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <p className="text-muted mt-2" style={{ fontSize: '0.75rem', lineHeight: '1.5' }}>
                                เบอร์โทรศัพท์ของตนเองคุณสามารถใช้ยืนยันบัญชี One Chat เพียงทีละหนึ่งบัญชี
                                และใช้เพื่อการยืนยันและการล็อคอินเท่านั้น
                            </p>
                        </Form>

                        /* === CASE: Password (เปลี่ยนรหัสผ่าน) === */
                    ) : modalType === 'password' ? (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                    รหัสผ่านปัจจุบัน <span style={{ color: '#dc3545' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="password"
                                    value={pwdCurrent}
                                    onChange={(e) => setPwdCurrent(e.target.value)}
                                    style={{ borderRadius: '8px', padding: '10px' }}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                    รหัสผ่านใหม่ <span style={{ color: '#dc3545' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="password"
                                    value={pwdNew}
                                    onChange={(e) => setPwdNew(e.target.value)}
                                    style={{ borderRadius: '8px', padding: '10px' }}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                    ยืนยันรหัสผ่านใหม่ <span style={{ color: '#dc3545' }}>*</span>
                                </Form.Label>
                                <Form.Control
                                    type="password"
                                    value={pwdConfirm}
                                    onChange={(e) => setPwdConfirm(e.target.value)}
                                    style={{ borderRadius: '8px', padding: '10px' }}
                                />
                            </Form.Group>
                        </Form>

                        /* === CASE: General (Username, Email) === */
                    ) : (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                    {modalContent.label1}
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    style={{ borderRadius: '8px', padding: '10px' }}
                                />
                                {modalContent.helper && (
                                    <Form.Text className="text-muted" style={{ fontSize: '0.8rem' }}>
                                        {modalContent.helper}
                                    </Form.Text>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                    {modalContent.label2}
                                </Form.Label>
                                <Form.Control
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{ borderRadius: '8px', padding: '10px' }}
                                />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>

                <Modal.Footer
                    style={{
                        borderTop: 'none',
                        padding: '0 24px 24px 24px',
                        justifyContent: 'space-between',
                    }}
                >
                    {modalType === 'phone' ? (
                        <Button variant="dark" onClick={handleNextStep} style={modalBtnFullWidth}>
                            ส่ง
                        </Button>
                    ) : (
                        <>
                            <Button variant="light" onClick={handleCloseModal} style={modalBtnCancel}>
                                ยกเลิก
                            </Button>
                            <Button variant="dark" onClick={handleNextStep} style={modalBtnSave}>
                                เสร็จสิ้น
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>


            {/* =======================================================
                MODAL 2: ถามเหตุผล (เฉพาะเปลี่ยนอีเมล)
               ======================================================= */}
            <Modal
                show={showEmailReasonModal}
                onHide={handleCloseEmailReasonModal}
                centered
                backdrop="static"
                keyboard={false}
                size="lg"
                style={{ fontFamily: 'Prompt, sans-serif' }}
            >
                <Modal.Header closeButton style={{ borderBottom: 'none', padding: '24px 24px 0 24px' }}>
                    <Modal.Title style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                        ทำไมคุณถึงเปลี่ยนอีเมล
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ padding: '0 24px 24px 24px' }}>
                    <Form style={{ marginTop: '10px' }}>
                        <Form.Check
                            type="radio"
                            label="มีคนขอให้ฉันเปลี่ยน"
                            name="emailReason"
                            className="mb-3"
                            style={{ fontSize: '0.95rem' }}
                        />
                        <Form.Check
                            type="radio"
                            label="ฉันเพิ่งสร้างอีเมลใหม่"
                            name="emailReason"
                            className="mb-3"
                            style={{ fontSize: '0.95rem' }}
                        />
                        <Form.Check
                            type="radio"
                            label="อื่นๆ"
                            name="emailReason"
                            className="mb-3"
                            style={{ fontSize: '0.95rem' }}
                        />
                    </Form>
                </Modal.Body>

                <Modal.Footer
                    style={{
                        borderTop: 'none',
                        padding: '0 24px 24px 24px',
                        justifyContent: 'space-between',
                    }}
                >
                    <Button variant="light" onClick={handleCloseEmailReasonModal} style={modalBtnCancel}>
                        ยกเลิก
                    </Button>
                    <Button variant="dark" onClick={handleEmailReasonNext} style={modalBtnSave}>
                        ต่อไป
                    </Button>
                </Modal.Footer>
            </Modal>


            {/* =======================================================
                MODAL 3: ยืนยันอีเมลเดิม (ต่อจากหน้าเหตุผล)
               ======================================================= */}
            <Modal
                show={showVerifyModal}
                onHide={handleCloseVerifyModal}
                centered
                backdrop="static"
                keyboard={false}
                size="lg"
                style={{ fontFamily: 'Prompt, sans-serif' }}
            >
                <Modal.Header closeButton style={{ borderBottom: 'none', padding: '24px 24px 0 24px' }}>
                    <Modal.Title
                        style={{
                            fontWeight: 'bold',
                            fontSize: '1.25rem',
                            width: '100%',
                            textAlign: 'center',
                        }}
                    >
                        ยืนยันที่อยู่อีเมล
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ padding: '20px 40px 40px 40px', textAlign: 'center' }}>
                    <div
                        style={{
                            marginBottom: '24px',
                            fontSize: '1rem',
                            color: '#000',
                            lineHeight: '1.6',
                        }}
                    >
                        เราจำเป็นต้องยืนยันที่อยู่อีเมลเก่าของคุณ<br />
                        <span style={{ fontWeight: 'bold' }}>{userData.email}</span> เพื่อเปลี่ยนแปลงอีเมล
                    </div>
                    <div
                        style={{
                            fontSize: '0.9rem',
                            color: '#6c757d',
                            lineHeight: '1.5',
                        }}
                    >
                        หากไม่สามารถเข้าถึงอีเมลได้<br />
                        โปรดติดต่อผู้ให้บริการอีเมลของคุณเพื่อเข้าถึงอีกครั้ง
                    </div>
                </Modal.Body>

                <Modal.Footer style={{ borderTop: 'none', padding: '0 24px 24px 24px', justifyContent: 'space-between' }}>
                    <Button variant="light" onClick={handleCloseVerifyModal} style={modalBtnCancel}>
                        ยกเลิก
                    </Button>
                    <Button variant="dark" onClick={handleConfirmVerify} style={modalBtnSave}>
                        ส่งรหัสการยืนยัน
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
}

export default Account;