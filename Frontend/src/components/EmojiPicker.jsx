import { useState, useRef, useEffect } from "react";
import "./EmojiPicker.css";

const EMOJI_DATA = [
  {
    name: "ล่าสุด",
    icon: "🕐",
    emojis: [],
  },
  {
    name: "หน้ายิ้ม",
    icon: "😊",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃",
      "😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙",
      "🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢",
      "🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏",
      "😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷",
      "🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠",
      "🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","☹️",
      "😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰",
      "😥","😢","😭","😱","😖","😣","😞","😓","😩","😫",
      "🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩",
      "🤡","👹","👺","👻","👽","👾","🤖",
    ],
  },
  {
    name: "มือ",
    icon: "👋",
    emojis: [
      "👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌",
      "🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉",
      "👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛",
      "🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅",
      "🤳","💪",
    ],
  },
  {
    name: "หัวใจ",
    icon: "❤️",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔",
      "❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝",
      "💟","♥️","💌","💋","😻","🫶",
    ],
  },
  {
    name: "สัตว์",
    icon: "🐶",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨",
      "🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐒",
      "🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇",
      "🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞",
      "🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🕸️","🦂","🐢",
      "🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡",
      "🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓",
    ],
  },
  {
    name: "อาหาร",
    icon: "🍔",
    emojis: [
      "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐",
      "🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑",
      "🌶️","🫑","🥒","🥬","🥦","🧄","🧅","🍄","🥜","🫘",
      "🌰","🍞","🥐","🥖","🫓","🥨","🥯","🥞","🧇","🧀",
      "🍖","🍗","🥩","🥓","🍔","🍟","🍕","🌭","🥪","🌮",
      "🌯","🫔","🥙","🧆","🥚","🍳","🥘","🍲","🫕","🥣",
      "🍜","🍝","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚",
      "🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧",
      "🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪",
      "☕","🍵","🫖","🥤","🧋","🍶","🍺","🍻","🥂","🍷",
    ],
  },
  {
    name: "กิจกรรม",
    icon: "⚽",
    emojis: [
      "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱",
      "🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳",
      "🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷",
      "⛸️","🥌","🎿","⛷️","🏂","🎯","🎮","🕹️","🎲","🎰",
      "🧩","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷",
      "🎺","🪗","🎸","🎻","🪕","🎵","🎶",
    ],
  },
  {
    name: "สัญลักษณ์",
    icon: "✅",
    emojis: [
      "✅","❌","⭕","❗","❓","‼️","⁉️","💯","🔥","✨",
      "⭐","🌟","💫","🎉","🎊","🎈","🏆","🥇","🥈","🥉",
      "🏅","🎖️","📌","📍","🔔","🔕","📢","📣","💬","💭",
      "🗯️","💤","👀","👁️","🫧","💢","💥","💦","💨","🕳️",
      "🚀","🛸","🌈","☀️","🌤️","⛅","🌦️","🌧️","⛈️","🌩️",
      "❄️","🌊","🔑","🗝️","💡","🔋","📱","💻","⌨️","🖥️",
    ],
  },
];

const RECENT_KEY = "emoji_recent";
const MAX_RECENT = 30;

const getRecent = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
};

const addRecent = (emoji) => {
  const recent = getRecent().filter((e) => e !== emoji);
  recent.unshift(emoji);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
};

const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(1);
  const [recentEmojis, setRecentEmojis] = useState(getRecent());
  const pickerRef = useRef(null);

  // ปิดเมื่อคลิกข้างนอก
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        if (e.target.closest('[aria-label="emoji"]')) return;
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleEmojiClick = (emoji) => {
    addRecent(emoji);
    setRecentEmojis(getRecent());
    onSelect(emoji);
  };

  // รวม recent เข้าหมวดแรก
  const categories = EMOJI_DATA.map((cat, idx) =>
    idx === 0 ? { ...cat, emojis: recentEmojis } : cat
  );

  const currentEmojis = categories[activeCategory]?.emojis || [];

  return (
    <div className="emoji-picker" ref={pickerRef}>
      {/* Category tabs */}
      <div className="emoji-picker-tabs">
        {categories.map((cat, idx) => (
          <button
            type="button"
            key={idx}
            className={`emoji-tab${activeCategory === idx ? " active" : ""}`}
            onClick={() => setActiveCategory(idx)}
            title={cat.name}
            disabled={idx === 0 && recentEmojis.length === 0}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* Category name */}
      <div className="emoji-picker-label">
        {categories[activeCategory]?.name}
      </div>

      {/* Emoji grid */}
      <div className="emoji-picker-grid">
        {currentEmojis.length === 0 ? (
          <div className="emoji-picker-empty">
            ยังไม่มี emoji ที่ใช้ล่าสุด
          </div>
        ) : (
          currentEmojis.map((emoji, idx) => (
            <button
              type="button"
              key={`${emoji}-${idx}`}
              className="emoji-item"
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default EmojiPicker;
