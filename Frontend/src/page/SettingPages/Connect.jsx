import { useState, useEffect } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import './Connect.css';

const PLATFORMS = [
    { key: 'line',      label: 'LINE OA',           icon: 'bi-chat-fill',        color: '#06C755' },
    { key: 'facebook',  label: 'Facebook Messenger', icon: 'bi-facebook',         color: '#1877F2' },
    { key: 'instagram', label: 'Instagram',          icon: 'bi-instagram',        color: '#E1306C' },
    { key: 'website',   label: 'Website Chat',       icon: 'bi-globe2',           color: '#6366f1' },
];

const EMPTY_FORM = { platform: 'line', channel_name: '', channel_id: '', access_token: '', channel_secret: '', webhook_url: '' };

const Connect = () => {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingChannel, setEditingChannel] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const token = sessionStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // ดึง channels ทั้งหมด
    const fetchChannels = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/channels', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
            const data = await res.json();
            setChannels(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchChannels(); }, []);

    // เปิด modal สร้างใหม่
    const openAdd = () => {
        setEditingChannel(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    // เปิด modal แก้ไข
    const openEdit = (ch) => {
        setEditingChannel(ch);
        setForm({
            platform: ch.platform,
            channel_name: ch.channel_name || '',
            channel_id: ch.channel_id || '',
            access_token: ch.access_token || '',
            channel_secret: ch.channel_secret || '',
            webhook_url: ch.webhook_url || '',
        });
        setShowModal(true);
    };

    // บันทึก (สร้าง/แก้ไข)
    const handleSave = async () => {
        if (!form.channel_name.trim()) return;
        try {
            setSaving(true);
            if (editingChannel) {
                await fetch(`/api/channels/${editingChannel.id}`, {
                    method: 'PUT', headers, body: JSON.stringify(form),
                });
                setChannels(prev => prev.map(c => c.id === editingChannel.id ? { ...c, ...form } : c));
            } else {
                const res = await fetch('/api/channels', {
                    method: 'POST', headers, body: JSON.stringify(form),
                });
                const data = await res.json();
                setChannels(prev => [{ id: data.id, ...form, status: 'active' }, ...prev]);
            }
            setShowModal(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    // เปิด/ปิด channel
    const handleToggle = async (ch) => {
        const newStatus = ch.status === 'active' ? 'inactive' : 'active';
        try {
            await fetch(`/api/channels/${ch.id}/toggle`, {
                method: 'PUT', headers, body: JSON.stringify({ status: newStatus }),
            });
            setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, status: newStatus } : c));
        } catch { /* silent */ }
    };

    // ลบ channel
    const handleDelete = async (id) => {
        if (!window.confirm('ยืนยันการลบช่องทางนี้?')) return;
        try {
            await fetch(`/api/channels/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            setChannels(prev => prev.filter(c => c.id !== id));
        } catch { /* silent */ }
    };

    // คัดลอก
    const handleCopy = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getPlatform = (key) => PLATFORMS.find(p => p.key === key) || { label: key, icon: 'bi-plug', color: '#888' };

    return (
        <div className="connect-page kanit-regular">
            {/* Header */}
            <div className="connect-header">
                <div>
                    <h4 className="connect-title">
                        <i className="bi bi-diagram-3"></i>
                        เชื่อมต่อช่องทาง
                    </h4>
                    <p className="connect-desc">
                        เชื่อมต่อแพลตฟอร์มภายนอก (LINE, Facebook, Instagram) เข้ากับ One Chat ผ่าน Webhook
                    </p>
                </div>
                <button className="connect-create-btn" onClick={openAdd}>
                    <i className="bi bi-plus-lg"></i>
                    เพิ่มช่องทาง
                </button>
            </div>

            {/* Platform Overview Cards */}
            <div className="ch-platform-grid">
                {PLATFORMS.map(p => {
                    const count = channels.filter(c => c.platform === p.key && c.status === 'active').length;
                    return (
                        <div key={p.key} className={`ch-platform-card ${count > 0 ? 'connected' : ''}`}>
                            <i className={`bi ${p.icon} ch-platform-icon`} style={{ color: p.color }}></i>
                            <div className="ch-platform-label">{p.label}</div>
                            <div className="ch-platform-count">
                                {count > 0 ? `${count} ช่องทาง` : 'ยังไม่เชื่อมต่อ'}
                            </div>
                            {count > 0 && <span className="ch-platform-badge">✓</span>}
                        </div>
                    );
                })}
            </div>

            {/* Channel Table */}
            <div className="connect-table-wrap" style={{ marginTop: '24px' }}>
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
                ) : channels.length === 0 ? (
                    <div className="connect-empty">
                        <i className="bi bi-diagram-3" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                        <p>ยังไม่มีช่องทาง — กดปุ่ม "เพิ่มช่องทาง" เพื่อเริ่มต้น</p>
                    </div>
                ) : (
                    <table className="connect-table">
                        <thead>
                            <tr>
                                <th>สถานะ</th>
                                <th>แพลตฟอร์ม</th>
                                <th>ชื่อช่องทาง</th>
                                <th>Webhook URL</th>
                                <th className="text-end">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {channels.map(ch => {
                                const plat = getPlatform(ch.platform);
                                return (
                                    <tr key={ch.id} className={ch.status !== 'active' ? 'disabled-row' : ''}>
                                        <td>
                                            <span className={`connect-status ${ch.status === 'active' ? 'active' : 'inactive'}`}>
                                                <span className="connect-status-dot"></span>
                                                {ch.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <i className={`bi ${plat.icon}`} style={{ color: plat.color, fontSize: '1.1rem' }}></i>
                                                <span className="connect-type-badge">{plat.label}</span>
                                            </div>
                                        </td>
                                        <td className="connect-name">{ch.channel_name}</td>
                                        <td>
                                            {ch.webhook_url ? (
                                                <div className="connect-key-cell">
                                                    <code className="connect-key-text" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                                        {ch.webhook_url}
                                                    </code>
                                                    <button className="connect-copy-btn" onClick={() => handleCopy(ch.id, ch.webhook_url)} title="คัดลอก">
                                                        <i className={`bi ${copiedId === ch.id ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                                                    </button>
                                                </div>
                                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>}
                                        </td>
                                        <td className="text-end">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                <Form.Check
                                                    type="switch"
                                                    id={`toggle-ch-${ch.id}`}
                                                    checked={ch.status === 'active'}
                                                    onChange={() => handleToggle(ch)}
                                                    className="connect-switch"
                                                />
                                                <button className="connect-copy-btn" onClick={() => openEdit(ch)} title="แก้ไข">
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button className="connect-copy-btn" onClick={() => handleDelete(ch.id)} title="ลบ" style={{ color: 'var(--status-error)' }}>
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="connect-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="connect-modal" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="connect-modal-header">
                            <h5>{editingChannel ? 'แก้ไขช่องทาง' : 'เพิ่มช่องทางใหม่'}</h5>
                            <button className="connect-modal-close" onClick={() => setShowModal(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="connect-modal-body">
                            {!editingChannel && (
                                <>
                                    <label className="connect-label">แพลตฟอร์ม</label>
                                    <select className="connect-input" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                                        {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                    </select>
                                </>
                            )}
                            <label className="connect-label" style={{ marginTop: editingChannel ? 0 : '14px' }}>ชื่อช่องทาง *</label>
                            <input className="connect-input" placeholder="เช่น LINE OA หลัก" value={form.channel_name} onChange={e => setForm({ ...form, channel_name: e.target.value })} />

                            <label className="connect-label" style={{ marginTop: '14px' }}>Channel ID</label>
                            <input className="connect-input" placeholder="เช่น @yourlineoa หรือ Page ID" value={form.channel_id} onChange={e => setForm({ ...form, channel_id: e.target.value })} />

                            <label className="connect-label" style={{ marginTop: '14px' }}>Access Token</label>
                            <input className="connect-input" type="password" placeholder="Channel Access Token" value={form.access_token} onChange={e => setForm({ ...form, access_token: e.target.value })} />

                            <label className="connect-label" style={{ marginTop: '14px' }}>Channel Secret</label>
                            <input className="connect-input" type="password" placeholder="Channel Secret" value={form.channel_secret} onChange={e => setForm({ ...form, channel_secret: e.target.value })} />

                            <label className="connect-label" style={{ marginTop: '14px' }}>Webhook URL</label>
                            <input className="connect-input" placeholder="https://your-domain.com/webhook" value={form.webhook_url} onChange={e => setForm({ ...form, webhook_url: e.target.value })} />
                        </div>
                        <div className="connect-modal-footer">
                            <button className="connect-cancel-btn" onClick={() => setShowModal(false)}>ยกเลิก</button>
                            <button className="connect-confirm-btn" onClick={handleSave} disabled={saving || !form.channel_name.trim()}>
                                {saving ? 'กำลังบันทึก...' : editingChannel ? 'บันทึก' : 'เพิ่มช่องทาง'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Connect;