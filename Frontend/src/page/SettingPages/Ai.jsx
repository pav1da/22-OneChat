// Ai.jsx
import { useState } from 'react';
import AiMain from './AiMain'; // Import เข้ามา
import AiList from './AiList'; // Import เข้ามา

function Ai() {
    const [currentView, setCurrentView] = useState('main');
    const [pageTitle, setPageTitle] = useState('');

    // ฟังก์ชันไปหน้า List
    const handleGoToList = (title) => {
        setPageTitle(title);
        setCurrentView('list');
    };

    // ฟังก์ชันกลับหน้า Main
    const handleBack = () => {
        setCurrentView('main');
    };

    return (
        <>
            {currentView === 'main' ? (
                // ส่งฟังก์ชันไปให้ลูกกด
                <AiMain onNavigate={handleGoToList} />
            ) : (
                // ส่ง title และฟังก์ชันย้อนกลับไปให้ลูก
                <AiList title={pageTitle} onBack={handleBack} />
            )}
        </>
    );
}

export default Ai;