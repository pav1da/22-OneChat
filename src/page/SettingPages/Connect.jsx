
import { Table, Button, Form } from 'react-bootstrap';
import { PencilFill } from 'react-bootstrap-icons'; 
import './Connect.css'; 

const Connect = () => {
    // Mock Data สำหรับตาราง
    const apiKeys = [
        { 
            id: 1, 
            status: 'Active', 
            name: 'Default API Key', 
            type: 'DEFAULT', 
            key: 'YourDefaultAPIKey', 
            isLink: false,
            hasToggle: false 
        },
        { 
            id: 2, 
            status: 'Active', 
            name: 'Identity key', 
            type: 'SECRET', 
            key: 'identity-YourIdentityKey', 
            isLink: true,
            hasToggle: true 
        },
        { 
            id: 3, 
            status: 'Active', 
            name: 'Web key', 
            type: 'WEB_SDK', 
            key: 'web_sdk-YourWebKey', 
            isLink: true,
            hasToggle: true 
        },
    ];

    // สีตามรูปภาพ
    const greenColor = '#1abc9c'; // สีเขียวปุ่ม Create
    const activeColor = '#28a745'; // สีเขียว Active
    const blueLink = '#007bff'; // สีฟ้าน้ำเงิน link
    const lightBg = '#f4f8fb'; // สีพื้นหลังกล่องล่าง
    const blueBtn = '#0099ff'; // สีฟ้าปุ่ม Reset

    return (
        <div className="kanit-regular px-4 pt-5" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            
            {/* --- ส่วนหัว (Header) --- */}
            <div className="mb-4">
                <h4 className="fs-3 mb-3" style={{ color: '#333' }}>API Key Management</h4>
                
                <div className="d-flex justify-content-between align-items-start">
                    <p className="text-muted mb-0 fs-6">
                        Manage the keys that Swrve uses to authenticate your API calls.
                    </p>
                    
                    {/* ปุ่ม Create new API key สีเขียว */}
                    <Button 
                        style={{ 
                            backgroundColor: greenColor, 
                            border: 'none', 
                            fontWeight: '400',
                            padding: '8px 20px'
                        }}
                    >
                        Create new API key
                    </Button>
                </div>
            </div>

            {/* --- ตาราง (Table) --- */}
            <div className="bg-white rounded-3 mb-5">
                <Table responsive borderless hover style={{ verticalAlign: 'middle' }}>
                    <thead className='fs-6' style={{ borderBottom: '2px solid #eee' }}>
                        <tr>
                            <th className="py-3 ps-3">Status</th>
                            <th className="py-3">Name</th>
                            <th className="py-3">Key Type</th> 
                            <th className="py-3">API Key</th>
                            <th className="py-3 text-end pe-4">Enable/Disable</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apiKeys.map((item) => (
                            <tr key={item.id} style={{ backgroundColor: '#f9fbfd', borderBottom: '1px solid #eee' }}>
                                {/* Status */}
                                <td className="ps-3" style={{ color: activeColor }}>{item.status}</td>
                                
                                {/* Name */}
                                <td>
                                    <span style={{ color: item.isLink ? blueLink : '#333', cursor: item.isLink ? 'pointer' : 'default' }}>
                                        {item.name}
                                    </span>
                                </td>
                                
                                {/* Key Type */}
                                <td className="text-muted text-uppercase">{item.type}</td>
                                
                                {/* API Key + Edit Icon */}
                                <td style={{ color: '#555' }}>
                                    {item.key}
                                    {item.isLink && (
                                        <PencilFill className="ms-3 text-muted" size={14} style={{ cursor: 'pointer' }} />
                                    )}
                                </td>
                                
                                {/* Enable/Disable Toggle */}
                                <td className="text-end pe-4">
                                    {item.hasToggle && (
                                        <Form.Check 
                                            type="switch"
                                            id={`custom-switch-${item.id}`}
                                            defaultChecked
                                            style={{ transform: 'scale(1.4)', display: 'inline-block' }}
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* --- ส่วนล่าง (Personal Key Footer) --- */}
            <div className="mb-2">
                <p className="text-muted mb-2">Your personal key is:</p>
                
                {/* กล่องสีฟ้าอ่อน */}
                <div className="p-4 rounded-3" style={{ backgroundColor: lightBg }}>
                    <div className="row mb-3 align-items-center">
                        <div className="col-auto text-end text-muted" style={{ width: '150px' }}>Name</div>
                        <div className="col text-muted">Robert Wu</div>
                    </div>
                    
                    <div className="row mb-3 align-items-center">
                        <div className="col-auto text-end text-muted" style={{ width: '150px' }}>Personal Key</div>
                        <div className="col text-muted">YourPersonalKey</div>
                    </div>

                    <div className="row align-items-center">
                        <div className="col-auto text-end" style={{ width: '170px' }}>Reset Personal Key</div>
                        <div className="col">
                            <Button 
                                style={{ 
                                    backgroundColor: blueBtn, 
                                    border: 'none', 
                                    padding: '6px 25px'
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default Connect;