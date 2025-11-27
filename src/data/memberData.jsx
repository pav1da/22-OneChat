// --- ข้อมูลผู้ใช้ทั้งหมด ---
export const usersData = [
    {
      id: 1,
      name: "pav1da",
      role: "it",
      team: "Facebook",
      status: "กำลังใช้งาน",
      color: "#9C27B0",
      email: "pav1da.it@onechat.com",
      phone: "099-999-9999",
      image: "/src/assets/Image/Admins/pav1da.png"
    },
    {
      id: 2,
      name: "miotar",
      role: "หัวหน้า",
      team: "Line",
      status: "กำลังใช้งาน",
      color: "#FF0000",
      email: "miotar.admin@onechat.com",
      phone: "011-111-1111",
      image: "/src/assets/Image/Admins/miotar.png"
    },
    {
      id: 3,
      name: "boss",
      role: "หัวหน้า",
      team: "Facebook",
      status: "ไม่ใช้งาน",
      color: "#2196F3",
      email: "A@gmail.com",
      phone: "082-222-2222",
      image: "/src/assets/Image/Admins/boss.png"
    },
    {
      id: 4,
      name: "Frieren",
      role: "สมาชิก",
      team: "Facebook",
      status: "ไม่ใช้งาน",
      color: "#4CAF50",
      email: "B@gmail.com",
      phone: "083-333-3333",
      image: "/src/assets/Image/Admins/Frieren.png"
    },
    {
      id: 5,
      name: "Customer VIP",
      role: "customer",
      team: "-",
      status: "กำลังใช้งาน",
      color: "#FF9800",
      email: "customer@yahoo.com",
      phone: "085-555-5555",
      image: "https://i.pravatar.cc/150?img=60"
    },
    {
      id: 6,
      name: "Soma",
      role: "สมาชิก",
      team: "Facebook",
      status: "กำลังใช้งาน",
      color: "#000000",
      email: "pheem@onechat.com",
      phone: "081-111-2222",
      image: "/src/assets/Image/Admins/soma.png"
    },
    {
      id: 7,
      name: "Hex",
      role: "สมาชิก",
      team: "LINE",
      status: "กำลังใช้งาน",
      color: "#FFC107",
      email: "ham@onechat.com",
      phone: "081-333-4444",
      image: "/src/assets/Image/Admins/Hex.png"
    },
    {
      id: 8,
      name: "Shoto",
      role: "สมาชิก",
      team: "LINE",
      status: "กำลังใช้งาน",
      color: "#607D8B",
      email: "tar@onechat.com",
      phone: "081-555-6666",
      image: "/src/assets/Image/Admins/shoto.png"
    }
  ];
  
  // --- ข้อมูลทีม (Mapping สมาชิกเข้าทีม) ---
  export const initialTeams = [
    {
      id: 1,
      name: "Facebook",
      memberCount: 2,
      isOpen: false,
      members: [
          usersData.find(u => u.name === "Pheem"), 
          usersData.find(u => u.name === "pav1da") 
      ].filter(Boolean),
    },
    {
      id: 2,
      name: "LINE",
      memberCount: 2,
      isOpen: false,
      members: [
        usersData.find(u => u.name === "Tar"),
        usersData.find(u => u.name === "Ham")
      ].filter(Boolean),
    },
  ];