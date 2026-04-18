import { useState, useEffect, useMemo } from "react";
import { Form, Spinner } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import { io } from "socket.io-client";

const Log = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterUser, setFilterUser] = useState("");
    const [filterAction, setFilterAction] = useState("");

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (filterUser) params.append("user", filterUser);
            if (filterAction) params.append("action", filterAction);

            const token = sessionStorage.getItem("token");
            const res = await fetch(`/api/logs?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error("ไม่สามารถดึงข้อมูล Log ได้");
            }

            const data = await res.json();
            setLogs(data.logs || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filterUser, filterAction]);

    // Socket.IO: real-time updates
    useEffect(() => {
        const socket = io();

        socket.on("new-log", (newLog) => {
            // เพิ่ม log ใหม่ไว้ด้านบนสุด
            setLogs((prev) => [newLog, ...prev]);
            setAllLogs((prev) => [newLog, ...prev]);
        });

        return () => socket.disconnect();
    }, []);

    // ดึงรายชื่อ users จาก EMP table (ข้อมูลปัจจุบัน)
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const res = await fetch("/api/users", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data || []);
                }
            } catch {
                // ignore — dropdown จะว่างเปล่า
            }
        };
        fetchUsers();
    }, []);

    // ดึง logs ทั้งหมด (ไม่มี filter) เพื่อสร้าง dropdown actions
    const [allLogs, setAllLogs] = useState([]);

    useEffect(() => {
        const fetchAllLogs = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const res = await fetch("/api/logs", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setAllLogs(data.logs || []);
                }
            } catch {
                // ignore
            }
        };
        fetchAllLogs();
    }, []);

    // ดึง unique actions จาก logs ทั้งหมด (ไม่ใช่แค่ที่กรองแล้ว)
    const uniqueActions = useMemo(
        () => [...new Set(allLogs.map((l) => l.action))],
        [allLogs],
    );

    // จัดรูปแบบวันที่ (รับ string จาก MySQL เช่น "2024-03-18 15:30:00")
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        // DB เก็บเวลา Bangkok แล้ว (TZ=Asia/Bangkok) แสดงตรงๆ ได้เลย
        const localDateStr = dateStr.replace(" ", "T");
        const d = new Date(localDateStr);
        return d.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        const localDateStr = dateStr.replace(" ", "T");
        const d = new Date(localDateStr);
        return d.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="kanit-regular h-100 d-flex flex-column px-3">
            {/* ================= Header Section ================= */}
            <div className="d-flex justify-content-end align-items-center">
                {/* Filters */}
                <div className="d-flex flex-column flex-sm-row gap-3">
                    {/* Filter by User */}
                    <div className="d-flex align-items-center gap-3">
                        <span className="text-nowrap" style={{ fontSize: "var(--fs-sm)" }}>กรองโดยผู้ใช้ :</span>
                        <Form.Select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="bg-light border-0 rounded-3"
                            style={{ minWidth: "200px", fontSize: "var(--fs-sm)" }}
                        >
                            <option value="">ค้นหาสมาชิก</option>
                            {users.map((user) => (
                                <option key={user.emp_id} value={user.username}>
                                    {user.username}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                    {/* Filter by Action */}
                    <div className="d-flex align-items-center gap-3">
                        <span className="text-nowrap" style={{ fontSize: "var(--fs-sm)" }}>กรองโดยการกระทำ :</span>
                        <Form.Select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="bg-light border-0 rounded-3"
                            style={{ minWidth: "200px", fontSize: "var(--fs-sm)" }}
                        >
                            <option value="">ค้นหาการกระทำ</option>
                            {uniqueActions.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                </div>
            </div>

            {/* ================= Log List Section ================= */}

            <div className="d-flex flex-column gap-2 overflow-auto mt-2">
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="secondary" />
                        <p className="mt-3 text-muted">กำลังโหลดข้อมูล...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-5 text-danger">
                        <i className="bi bi-exclamation-triangle fs-1"></i>
                        <p className="mt-3">{error}</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-journal-text fs-1"></i>
                        <p className="mt-3">ไม่พบบันทึกกิจกรรม</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.log_id}
                            className="d-flex align-items-center p-2 rounded-4 w-100 log-item"
                        >
                            {/* 1. Avatar */}
                            <div className="flex-shrink-0">
                                {log.avatar || users.find(u => u.username === log.user)?.image ? (
                                    <img
                                        src={log.avatar || users.find(u => u.username === log.user)?.image}
                                        alt={log.user}
                                        className="rounded-circle"
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            backgroundColor: "#e0e7ef",
                                            color: "#5a6f85",
                                            fontSize: "1rem",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {log.user?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                )}
                            </div>
                            {/* 2. Content Info */}
                            <div className="flex-grow-1 ms-3">
                                <div style={{ fontSize: "var(--fs-base)" }}>
                                    <span style={{ fontWeight: 500 }}>{log.user}</span>
                                    <span className="mx-2">{log.action}</span>
                                    <span style={{ fontWeight: 500 }}>{log.target}</span>
                                    {log.details && (
                                        <span className="ms-2 text-secondary">{log.details}</span>
                                    )}
                                </div>

                                <div
                                    className="text-secondary mt-1 fw-medium"
                                    style={{ fontSize: "var(--fs-xs)" }}
                                >
                                    วันที่ {formatDate(log.created_at)} เวลา{" "}
                                    {formatTime(log.created_at)}
                                </div>
                            </div>

                            {/* 3. Icon Chevron */}
                            <div className="flex-shrink-0 ms-3">
                                <i className="bi bi-chevron-right text-muted fs-5"></i>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Log;
