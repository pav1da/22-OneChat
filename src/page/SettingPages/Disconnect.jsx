import { Form } from 'react-bootstrap';
import { ChevronRight } from 'react-bootstrap-icons';

const Disconnect = () => {
    return (
        <div className='disconnect-page'>
            <div className="profile-info-item d-flex justify-content-between align-items-center">
                <h5 className="mb-0">ยกเลิกการเชื่อมต่อทั้งหมด</h5>
                <Form.Check
                    type="switch"
                    id="disconnect-toggle"
                    label=""
                />
            </div>

            <div className="profile-info-item d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="mb-1">ตัดการเชื่อมต่อแพลตฟอร์มทั้งหมด</h5>

                </div>
                <ChevronRight size={20} className="text-muted" />
            </div>
        </div>
    );
}

export default Disconnect;
