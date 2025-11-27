function About() {
  return (
    <div className="about-page pt-5" style={{padding:"150px"}}>

      <h2 className="fs-3 text-center mb-5">เกี่ยวกับ One Chat (About One Chat)</h2>


      <h4 className="fs-5 mt-5 mb-3">One Chat คืออะไร?</h4>
      <p className="fs-6">
        One Chat เป็นแพลตฟอร์มรวบรวมศูนย์บริการแชทจากหลายช่องทางไว้ในที่เดียว 
        ช่วยให้ธุรกิจสามารถจัดการแชทจาก LINE, Facebook, Instagram, Shopee และช่องทางอื่น ๆ ได้อย่างครบวงจร 
        ผ่านหน้าจอเดียวแบบมีประสิทธิภาพและปลอดภัย
      </p>

      <h4 className="fs-5 mt-5 mb-3">พันธกิจของเรา</h4>
      <p className="fs-6">
        "ทำให้ทุกการสื่อสารระหว่างแบรนด์กับลูกค้าเป็นเรื่องง่าย รวดเร็ว และอัจฉริยะ"
      </p>

      <h4 className="fs-5 mt-5 mb-3">จุดเด่นของ One Chat</h4>
      <ul className="fs-6">
        <li>รวมทุกแพลตฟอร์มไว้ใน Inbox เดียว</li>
        <li>มี AI Meta Chat ช่วยตอบแชทอัตโนมัติ</li>
        <li>รองรับการทำงานแบบทีม (Team Collaboration)</li>
        <li>ระบบวิเคราะห์ประสิทธิภาพการตอบแชท (Analytics)</li>
        <li>ปลอดภัยด้วยการยืนยันตัวตนสองขั้นตอน (2FA) และการเข้ารหัสข้อมูล</li>
      </ul>

      <h4 className="fs-5 mt-5 mb-3">เทคโนโลยีที่ใช้</h4>
      <ul className="fs-6">
        <li>React + Node.js</li>
        <li>OpenAI GPT + Meta AI Integration</li>
        <li>Cloud Security ผ่านมาตรฐาน ISO/IEC 27001</li>
      </ul>
    </div>
  );
}

export default About;
