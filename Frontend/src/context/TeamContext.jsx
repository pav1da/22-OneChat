import { createContext, useContext, useState, useMemo } from "react";

// data/teams ถูกลบไปแล้ว — ใช้ array เปล่าเป็น fallback (จะเชื่อม API ทีหลัง)
const allTeams = [];

const TeamContext = createContext(null);

export const TeamProvider = ({ children, currentUser }) => {
  // ทีมที่เลือกอยู่ — null หมายถึง "All teams"
  const [selectedTeam, setSelectedTeam] = useState(null);

  const isPrivilegedUser =
    currentUser?.role === "it" || currentUser?.role === "admin";

  // ทีมที่ user เห็นได้
  const visibleTeams = useMemo(() => {
    if (isPrivilegedUser) {
      return allTeams; // IT/Admin เห็นทุกทีม
    }
    // User ทั่วไปเห็นแค่ทีมที่ตัวเองอยู่
    return allTeams.filter((team) =>
      team.members.includes(currentUser?.id)
    );
  }, [currentUser, isPrivilegedUser]);

  // ตั้งทีมเริ่มต้นถ้ายังไม่ได้เลือก
  const effectiveTeam = useMemo(() => {
    if (selectedTeam) return selectedTeam;
    if (isPrivilegedUser) return null; // IT default = All teams
    return visibleTeams[0] || null; // User default = ทีมแรก
  }, [selectedTeam, isPrivilegedUser, visibleTeams]);

  const isAllTeams = effectiveTeam === null;

  return (
    <TeamContext.Provider
      value={{
        teams: visibleTeams,
        allTeams,
        selectedTeam: effectiveTeam,
        setSelectedTeam,
        isAllTeams,
        isPrivilegedUser,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
};
