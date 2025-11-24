
const Connect = () => {
    return (
        // แก้ตรง style: เปลี่ยน marginLeft เป็น margin: '0 auto' เพื่อจัดกึ่งกลาง
        <div className="px-3 pt-2" style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            {/* ส่วนหัวข้อ: การเชื่อมต่อ */}
            <div className="mb-4">
                <h5 className="mb-1 font-weight-bold" style={{ fontSize: '1.1rem' }}>การเชื่อมต่อ</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                    อธิบายคร่าวๆ
                </p>
            </div>

            {/* กล่องที่ 1: บัญชีที่เชื่อมต่อ */}
            <div className="d-flex justify-content-between align-items-center border rounded-3 p-3 mb-3 bg-white">
                <div>
                    <h6 className="mb-1 font-weight-bold" style={{ fontSize: '1rem' }}>บัญชีที่เชื่อมต่อ</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>0 คำตอบ</p>
                </div>
                <button className="btn-edit-dark">
                    เชื่อมต่อ
                </button>
            </div>

            {/* กล่องที่ 2: แพลตฟอร์มที่เชื่อมต่อ */}
            <div className="d-flex justify-content-between align-items-center border rounded-3 p-3 mb-3 bg-white">
                <div>
                    <h6 className="mb-1 font-weight-bold" style={{ fontSize: '1rem' }}>แพลตฟอร์มที่เชื่อมต่อ</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>0 คำตอบ</p>
                </div>
                <button className="btn-edit-dark">
                    เชื่อมต่อ
                </button>
            </div>

        </div>
    );
}

export default Connect;