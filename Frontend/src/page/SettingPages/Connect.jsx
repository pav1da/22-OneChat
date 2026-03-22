import { useState, useEffect } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import './Connect.css';

const Connect = () => {
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [personalKey, setPersonalKey] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyType, setNewKeyType] = useState('DEFAULT');
    const [creating, setCreating] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [resetting, setResetting] = useState(false);

    const token = sessionStorage.getItem('token');

    // ดึง API Keys
    const fetchKeys = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/api-keys', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูล API Keys ได้');
            const data = await res.json();
            setApiKeys(data.keys || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchKeys(); }, []);

    // สร้าง API Key ใหม่
    const handleCreate = async () => {
        if (!newKeyName.trim()) return;
        try {
            setCreating(true);
            const res = await fetch('/api/api-keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newKeyName, type: newKeyType }),
            });
            if (!res.ok) throw new Error('สร้าง API Key ไม่สำเร็จ');
            const data = await res.json();
            // เพิ่ม key ใหม่เข้า list
            setApiKeys(prev => [...prev, { id: data.id || Date.now(), name: newKeyName, type: newKeyType, key: data.key || data.message, enabled: true }]);
            setNewKeyName('');
            setNewKeyType('DEFAULT');
            setShowCreateModal(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    // เปิด/ปิด API Key
    const handleToggle = async (id, currentEnabled) => {
        try {
            await fetch(`/api/api-keys/${id}/toggle`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ enabled: !currentEnabled }),
            });
            setApiKeys(prev =>
                prev.map(k => (k.id === id ? { ...k, enabled: !k.enabled } : k))
            );
        } catch {
            // silent
        }
    };

    // Reset Personal Key
    const handleResetPersonal = async () => {
        try {
            setResetting(true);
            const res = await fetch('/api/api-keys/reset-personal', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Reset ไม่สำเร็จ');
            const data = await res.json();
            setPersonalKey(data.newKey || 'KEY_GENERATED');
        } catch (err) {
            alert(err.message);
        } finally {
            setResetting(false);
        }
    };

    // Copy key to clipboard
    const handleCopy = (id, key) => {
        navigator.clipboard.writeText(key);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Mask key for display
    const maskKey = (key) => {
        if (!key || key.length < 12) return key || '—';
        return key.slice(0, 8) + '••••••••' + key.slice(-4);
    };

    return (
        <div className="connect-page kanit-regular">
            {/* Header */}
            <div className="connect-header">
                <div>
                    <h4 className="connect-title">
                        <i className="bi bi-key"></i>
                        API Key Management
                    </h4>
                    <p className="connect-desc">
                        จัดการ API Keys สำหรับเชื่อมต่อแพลตฟอร์มภายนอกกับ One Chat
                    </p>
                </div>
                <button className="connect-create-btn" onClick={() => setShowCreateModal(true)}>
                    <i className="bi bi-plus-lg"></i>
                    สร้าง API Key ใหม่
                </button>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="connect-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="connect-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="connect-modal-header">
                            <h5>สร้าง API Key ใหม่</h5>
                            <button className="connect-modal-close" onClick={() => setShowCreateModal(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="connect-modal-body">
                            <label className="connect-label">ชื่อ Key</label>
                            <input
                                type="text"
                                className="connect-input"
                                placeholder="เช่น LINE Channel Token"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                            />
                            <label className="connect-label mt-3">ประเภท</label>
                            <select
                                className="connect-input"
                                value={newKeyType}
                                onChange={(e) => setNewKeyType(e.target.value)}
                            >
                                <option value="DEFAULT">DEFAULT</option>
                                <option value="SECRET">SECRET</option>
                                <option value="WEB_SDK">WEB_SDK</option>
                            </select>
                        </div>
                        <div className="connect-modal-footer">
                            <button className="connect-cancel-btn" onClick={() => setShowCreateModal(false)}>
                                ยกเลิก
                            </button>
                            <button className="connect-confirm-btn" onClick={handleCreate} disabled={creating || !newKeyName.trim()}>
                                {creating ? 'กำลังสร้าง...' : 'สร้าง Key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="connect-table-wrap">
                {loading ? (
                    <div className="connect-empty">
                        <Spinner animation="border" size="sm" />
                        <span className="ms-2">กำลังโหลด...</span>
                    </div>
                ) : error ? (
                    <div className="connect-empty">
                        <i className="bi bi-exclamation-triangle" style={{ color: 'var(--status-warning)' }}></i>
                        <span>{error}</span>
                    </div>
                ) : apiKeys.length === 0 ? (
                    <div className="connect-empty">
                        <i className="bi bi-key" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                        <p>ยังไม่มี API Key — กดปุ่ม "สร้าง API Key ใหม่" เพื่อเริ่มต้น</p>
                    </div>
                ) : (
                    <table className="connect-table">
                        <thead>
                            <tr>
                                <th>สถานะ</th>
                                <th>ชื่อ</th>
                                <th>ประเภท</th>
                                <th>API Key</th>
                                <th className="text-end">เปิด/ปิด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {apiKeys.map((item) => (
                                <tr key={item.id} className={!item.enabled ? 'disabled-row' : ''}>
                                    <td>
                                        <span className={`connect-status ${item.enabled ? 'active' : 'inactive'}`}>
                                            <span className="connect-status-dot"></span>
                                            {item.enabled ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="connect-name">{item.name}</td>
                                    <td>
                                        <span className="connect-type-badge">{item.type}</span>
                                    </td>
                                    <td>
                                        <div className="connect-key-cell">
                                            <code className="connect-key-text">{maskKey(item.key)}</code>
                                            <button
                                                className="connect-copy-btn"
                                                onClick={() => handleCopy(item.id, item.key)}
                                                title="คัดลอก"
                                            >
                                                <i className={`bi ${copiedId === item.id ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="text-end">
                                        <Form.Check
                                            type="switch"
                                            id={`toggle-${item.id}`}
                                            checked={item.enabled}
                                            onChange={() => handleToggle(item.id, item.enabled)}
                                            className="connect-switch"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Personal Key Section */}
            <div className="connect-personal">
                <div className="connect-personal-header">
                    <i className="bi bi-person-badge"></i>
                    <span>Personal Key ของคุณ</span>
                </div>
                <div className="connect-personal-body">
                    <div className="connect-personal-row">
                        <span className="connect-personal-label">Personal Key</span>
                        <code className="connect-personal-value">
                            {personalKey || '••••••••••••••••'}
                        </code>
                    </div>
                    <button
                        className="connect-reset-btn"
                        onClick={handleResetPersonal}
                        disabled={resetting}
                    >
                        <i className="bi bi-arrow-clockwise"></i>
                        {resetting ? 'กำลัง Reset...' : 'Reset Personal Key'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Connect;