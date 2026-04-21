// ==========================================
// Avatar Utilities - สำหรับจัดการ Fallback รูประจำตัว
// ==========================================

export const avatarColors = [
    '#F26623', '#E8913A', '#D4614B', '#C7956D',
    '#5B8C5A', '#3A7CA5', '#6C5B7B', '#C06C84',
    '#355C7D', '#F67280', '#2A9D8F', '#264653',
];

/**
 * สุ่มสีตามตัวอักษรของชื่อ
 * @param {string} name 
 * @returns HEX Color String
 */
export const getAvatarColor = (name) => {
    if (!name) return '#6C5B7B'; // Fallback default color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
};

/**
 * ดึงตัวอักษรแรก (ย่อเป็นตัวพิมพ์ใหญ่) 
 * @param {string} name 
 * @returns string หรือ '?' ถ้าไม่มีข้อมูล
 */
export const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
};
