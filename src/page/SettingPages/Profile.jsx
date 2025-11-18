

// import { useState, useRef, useEffect } from 'react';
// import { Stack } from 'react-bootstrap';
// import { CameraFill } from 'react-bootstrap-icons';

// function Profile() {
//     const [imagePreview, setImagePreview] = useState(null);
//     const fileInputRef = useRef(null);

//     useEffect(() => {
//         return () => {
//             if (imagePreview) {
//                 URL.revokeObjectURL(imagePreview);
//             }
//         };
//     }, [imagePreview]);

//     const handleEditClick = () => {
//         fileInputRef.current.click();
//     };

//     const handleFileChange = (event) => {
//         const file = event.target.files[0];
//         if (file) {
//             const newPreviewUrl = URL.createObjectURL(file);
//             setImagePreview(newPreviewUrl);
//         }
//     };

//     return (
//         <div> 
//             <Stack direction="horizontal" gap={3} className="align-items-center mb-4 ">
//                 <div className="position-relative">
//                     <div className="profile-avatar-lg">
//                         {imagePreview && (
//                             <img src={imagePreview} alt="Profile Preview" />
//                         )}
//                     </div>
//                     <div className="avatar-edit-icon" onClick={handleEditClick}>
//                         <CameraFill size={14} />
//                     </div>
//                 </div>
//                 <h4 className="fw-bold m-0 te">โปรไฟล์</h4>
//             </Stack>

//             <input
//                 type="file"
//                 ref={fileInputRef}
//                 onChange={handleFileChange}
//                 style={{ display: 'none' }}
//                 accept="image/png, image/jpeg, image/gif"
//             />

//             {/* รายการข้อมูล */}
//             <Stack gap={4} className="mt-5 profile-info-list">
//                 <div className="profile-info-item">
//                     <div className="label">ชื่อ</div>
//                     <div className="value">ภาวิฉา ใจน้อย</div>
//                 </div>
//                 <div className="profile-info-item">
//                     <div className="label">ID</div>
//                     <div className="value">Pav1da</div>
//                 </div>
//                 <div className="profile-info-item">
//                     <div className="label">E-Mail</div>
//                     <div className="value">Pav1da@spumail.net</div>
//                 </div>
//                 <div className="profile-info-item">
//                     <div className="label">หมายเลขโทรศัพท์</div>
//                     <div className="value">08XXXXXXXX</div>
//                 </div>
//                 <div className="profile-info-item">
//                     <div className="label">สถานะทีม</div>
//                     <div className="value">Line-OA: Knock Knock, FB: Dew Flower Shop</div>
//                 </div>
//             </Stack>
//         </div>
//     );
// }

// export default Profile;