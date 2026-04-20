
import { GeoAltFill, EnvelopeFill, Globe } from 'react-bootstrap-icons';

function Contact() {
  return (
    <div className='pt-5' style={{padding:"150px"}}>
      {/* ส่วนหัว */}
      <h2 className="fs-3 text-center mb-3">ติดต่อเรา (Contact Us)</h2>
      <p className="text-center text-muted mb-5 fs-5">
        หากคุณต้องการสอบถามข้อมูล หรือข้อติดขัดฝ่ายสนับสนุนลูกค้า เรายินดีให้บริการ
      </p>

      {/* 1. ส่วนที่อยู่สำนักงาน */}
      <div className="mb-5">
        <h4 className="fs-4 mb-3 d-flex align-items-center">
          <GeoAltFill className="me-2" /> ที่อยู่สำนักงาน
        </h4>
        <div className="ps-4">
          <p className="mb-1 fs-6 ">One Chat Co., Ltd.</p>
          <p className="mb-1 fs-6 text-muted">99/9 อาคารโอเพ่นแพลทฟอร์ม ชั้น 5 แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500</p>
          
          <p className="mb-1 fs-6 mt-3">โทรศัพท์</p>
          <p className="mb-1 fs-6 text-muted">02-123-4567</p>
          <p className="text-muted fs-6">
            (เปิดให้บริการวันจันทร์-ศุกร์ เวลา 09:00–18:00 น.)
          </p>
        </div>
      </div>

      {/* 2. ส่วนอีเมล */}
      <div className="mb-5">
        <h4 className="fs-4 mb-3 d-flex align-items-center">
          <EnvelopeFill className="me-2" /> อีเมล
        </h4>
        <ul className="list-unstyled ps-4">
          <li className="mb-2 fs-6">
            <span>ฝ่ายบริการลูกค้า:</span> <span className="text-muted">support@onechat.ai</span>
          </li>
          <li className="mb-2 fs-6">
            <span>ฝ่ายเทคนิค:</span> <span className="text-muted">dev@onechat.ai</span>
          </li>
          <li className="mb-2 fs-6">
            <span>ฝ่ายการตลาด / พันธมิตร:</span> <span className="text-muted">marketing@onechat.ai</span>
          </li>
        </ul>
      </div>

      {/* 3. ส่วนโซเชียลมีเดีย */}
      <div className="mb-5">
        <h4 className="fs-4 mb-3 d-flex align-items-center">
          <Globe className="me-2" /> โซเชียลมีเดีย
        </h4>
        <ul className="list-unstyled ps-4">
          <li className="mb-2 fs-6">
            <span>Facebook:</span> <span className="text-muted">facebook.com/onechat.ai</span>
          </li>
          <li className="mb-2 fs-6">
            <span>Line Official:</span> <span className="text-muted">@onechat</span>
          </li>
          <li className="mb-2 fs-6">
            <span>Instagram:</span> <span className="text-muted">instagram.com/onechat.ai</span>
          </li>
          <li className="mb-2 fs-6">
            <span>Website:</span> <span className="text-muted">www.onechat.ai</span>
          </li>
        </ul>
      </div>

    </div>
  );
}

export default Contact;