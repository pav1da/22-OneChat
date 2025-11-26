import { useRef, useEffect } from "react";
import { Badge, Button, Form } from "react-bootstrap";
import "./inbox.css";
import ChatList from "./chatList/ChatList";

const Inbox = ({ currentUser }) => {
    const msgRef = useRef(null);
    const endRef = useRef(null);

    useEffect(() => {
        if (msgRef.current) {
            msgRef.current.style.height = "auto";
            msgRef.current.style.height = msgRef.current.scrollHeight + "px";
        }
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const autoResize = (e) => {
        const el = e.target;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };

    return (
        <div className="kanit-regular height-fix d-flex flex-column mx-4">
            {/* Start Header Section*/}
            <div className="d-flex gap-2 mb-3">
                {/* Return Button */}
                <button className="btn-sm-circle">
                    <i className="bi bi-arrow-left"></i>
                </button>
                {/* Title */}
                <div className="w-100 rounded-5 ps-4 d-flex align-items-center fs-5 bg-white-translucent">
                    All Chats
                </div>
            </div>
            {/* End Header Section */}
            <div className="d-flex gap-2 flex-grow-1 h-100">
                {/* Start ChatList Section */}
                <div className="bg-white-translucent rounded-4 p-3 w-50 d-flex flex-column h-100">
                    {/* Start Search Section */}
                    <div className="d-flex gap-2 flex-shrink-0 align-items-center border-bottom border-secondary-subtle pb-3">
                        {/* Search Bar */}
                        <Form.Control
                            placeholder="Search"
                            className="custom-search-input"
                        />
                        {/* Sort */}
                        <div className="custom-icon-sort">
                            <i className="bi bi-arrow-down-up"></i>
                        </div>
                    </div>
                    {/* End Search Section */}

                    {/* Start Chat List */}
                    <div className="list">
                        <ChatList />
                    </div>
                </div>
                {/* End ChatList Section */}

                {/* Start Chat Section */}
                <div className="w-100 bg-white-translucent rounded-4 p-3 d-flex flex-column h-100">
                    {/* Start Top Section */}
                    <div className="d-flex gap-3 custom-top-chat pb-3 mx-1 border-secondary-subtle border-bottom">
                        <div className="d-flex gap-3">
                            {/* Profile */}
                            <img
                                src="./src/assets/Image/Customers/Harumasa.png"
                                className="rounded-circle "
                                style={{ width: "46px", height: "46px", objectFit: "cover" }}
                            />
                            {/* Username */}
                            <span style={{ fontSize: "18px" }} className="pt-2">
                                Harumasa
                            </span>
                            {/* Status */}
                        </div>
                        <div className="d-flex gap-3 align-items-center">
                            <Badge className="bg-warning custom-badge-top">
                                กำลังดำเนินการ
                            </Badge>
                            <i className="bi bi-three-dots-vertical fs-5"></i>
                        </div>
                    </div>
                    {/* End Top Section */}

                    {/* Chat container */}
                    <div className="flex-grow-1 overflow-y-auto d-flex flex-column gap-2">
                        <div className="message">
                            <img src="./src/assets/Image/Customers/Harumasa.png" alt="" />
                            <div className="texts">
                                <p>
                                    Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nam
                                    beatae ea praesentium tempore dicta harum, debitis ipsum dolor
                                    corporis. Cupiditate quis provident reprehenderit sit quas
                                    corrupti vero. Aperiam, autem quaerat.
                                </p>
                            </div>
                        </div>
                        <div className="message own">
                            <div className="texts">
                                <p>
                                    Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nam
                                    beatae ea praesentium tempore dicta harum, debitis ipsum dolor
                                    corporis. Cupiditate quis provident reprehenderit sit quas
                                    corrupti vero. Aperiam, autem quaerat.
                                </p>
                            </div>
                        </div>
                        <div className="message">
                            <img src="./src/assets/Image/Customers/Harumasa.png" alt="" />
                            <div className="texts">
                                <p>
                                    Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nam
                                    beatae ea praesentium tempore dicta harum, debitis ipsum dolor
                                    corporis. Cupiditate quis provident reprehenderit sit quas
                                    corrupti vero. Aperiam, autem quaerat.
                                </p>
                            </div>
                        </div>
                        <div className="message own">
                            <div className="texts">
                                <p>
                                    Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nam
                                    beatae ea praesentium tempore dicta harum, debitis ipsum dolor
                                    corporis. Cupiditate quis provident reprehenderit sit quas
                                    corrupti vero. Aperiam, autem quaerat.
                                </p>
                            </div>
                        </div>
                        <div className="message">
                            <img src="./src/assets/Image/Customers/Harumasa.png" alt="" />
                            <div className="texts">
                                <p>
                                    Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nam
                                    beatae ea praesentium tempore dicta harum, debitis ipsum dolor
                                    corporis. Cupiditate quis provident reprehenderit sit quas
                                    corrupti vero. Aperiam, autem quaerat.
                                </p>
                            </div>
                        </div>
                        <div className="message own">
                            <div className="texts">
                                <img
                                    src="https://www.shutterstock.com/image-photo/awesome-pic-natureza-600nw-2408133899.jpg"
                                    alt=""
                                />
                                <p>
                                    Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nam
                                    beatae ea praesentium tempore dicta harum, debitis ipsum dolor
                                    corporis. Cupiditate quis provident reprehenderit sit quas
                                    corrupti vero. Aperiam, autem quaerat.
                                </p>
                            </div>
                        </div>
                        <div ref={endRef}></div>
                    </div>

                    {/* Text Section */}
                    <div className="flex-shrink-0 pt-3">
                        <div className="d-flex flex-row p-1 pe-3 gap-1 align-items-center custom-bottom-chat">
                            {/* Icons Button */}
                            <div className="d-flex ps-2">
                                {/* Emoji Icon */}
                                <Button variant="link" className="text-black p-1">
                                    <i
                                        className="bi bi-emoji-smile fs-4"
                                        style={{ lineHeight: 1 }}
                                    />
                                </Button>
                            </div>

                            {/* Text Area */}
                            <Form.Control
                                as="textarea"
                                rows={1}
                                placeholder="พิมพ์ข้อความ"
                                ref={msgRef}
                                onInput={autoResize}
                                className="w-100 pt-2 custom-text-input"
                                style={{
                                    overflow: "hidden",
                                    resize: "none",
                                    minHeight: "40px",
                                    maxHeight: "120px",
                                }}
                            />
                            {/* Icons Button */}
                            <div className="d-flex ps-2">
                                {/* Mic Icon */}
                                <Button variant="link" className="text-black p-1">
                                    <i className="bi bi-mic fs-4" style={{ lineHeight: 1 }}></i>
                                </Button>
                                {/* Image Icon */}
                                <Button variant="link" className="text-black p-1">
                                    <i className="bi bi-image fs-4" style={{ lineHeight: 1 }}></i>
                                </Button>
                                {/* Card Message Icon */}
                                <Button variant="link" className="text-black p-1">
                                    <i
                                        className="bi bi-sticky fs-4"
                                        style={{ lineHeight: 1 }}
                                    ></i>
                                </Button>
                            </div>

                            {/* Send Button */}
                            {/* <Button style={{ padding: "8px 18px", maxHeight: "42px"}}>Send</Button> */}
                        </div>
                    </div>
                </div>
                {/* End Chat Section */}

                {/* Start Profile Section */}
                <div className="w-50 bg-white-translucent align-items-center rounded-4 pt-3 d-flex flex-column h-100">
                    {/* Profile */}
                    <img
                        src="./src/assets/Image/Customers/Harumasa.png"
                        className="rounded-circle mt-5"
                        style={{ width: "140px", height: "140px", objectFit: "cover" }}
                    />
                    {/* User Name */}
                    <p className="mt-4">
                        Asaba Harumasa &nbsp;<i className="bi bi-pencil"></i>
                    </p>
                    {/* ผู้รับผิดชอบ */}
                    <div className="mt-5">
                        <p>
                            ผู้รับผิดชอบ : &nbsp;&nbsp;
                            <img
                                src={currentUser?.image || "https://i.pravatar.cc/150?img=12"}
                                alt="Admin Profile"
                                className="rounded-circle"
                                style={{ width: "40px", height: "40px", objectFit: "cover" }}
                            />
                            &nbsp; {currentUser?.name || "Admin"}
                        </p>
                        <hr />
                        {/* Note Section */}
                        <div className="flex-grow-1 w-100">
                            {/* Title */}
                            <div className="d-flex justify-content-between">
                                <p>โน๊ต</p>
                                <i className="bi bi-plus"></i>
                            </div>
                        </div>
                    </div>
                </div>
                {/* End Profile Section */}
            </div>
        </div>
    );
};

export default Inbox;
