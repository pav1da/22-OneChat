import "bootstrap-icons/font/bootstrap-icons.css";
import "./team.css";

const Teams = () => {
  return (
    <div className="teams-container px-4">
      <div className="teams-table-header">
        <div className="col-name">ชื่อ</div>
        <div className="col-team">ทีม</div>
        <div className="col-role">บทบาท</div>
        <div className="col-status">สถานะ</div>
        <div className="col-actions"></div>
      </div>
    </div>
  );
};

export default Teams;
