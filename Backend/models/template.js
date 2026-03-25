const pool = require('../config/db.js');

const Template = {
    /**
     * สร้าง Template ใหม่
     * @param {Object} data - ข้อมูล template
     * @param {string} data.name - ชื่อ template (เช่น 'Welcome message')
     * @param {string} data.type - ประเภท ('buttons', 'confirm', 'carousel', 'image_carousel')
     * @param {Object} data.content - โครงสร้าง JSON ของ template 
     * @param {number} data.created_by - ID ของ emp ที่สร้าง
     */
    /*
      ======== ตัวอย่างโครงสร้าง data.content สำหรับแต่ละประเภท ========

      1. Buttons template 
      {
        "thumbnailImageUrl": "https://example.com/image.jpg",
        "imageAspectRatio": "rectangle",
        "imageSize": "cover",
        "imageBackgroundColor": "#FFFFFF",
        "title": "Menu",
        "text": "Please select",
        "defaultAction": {
          "type": "uri",
          "label": "View detail",
          "uri": "http://example.com/page/123"
        },
        "actions": [
          {
            "type": "postback",
            "label": "Buy",
            "data": "action=buy&itemid=123"
          },
          {
            "type": "uri",
            "label": "View detail",
            "uri": "http://example.com/page/123"
          }
        ]
      }

      2. Confirm template
      {
        "text": "Are you sure?",
        "actions": [
          {
            "type": "message",
            "label": "Yes",
            "text": "yes"
          },
          {
            "type": "message",
            "label": "No",
            "text": "no"
          }
        ]
      }

      3. Carousel template
      {
        "columns": [
          {
            "thumbnailImageUrl": "https://example.com/item1.jpg",
            "imageBackgroundColor": "#FFFFFF",
            "title": "this is menu",
            "text": "description",
            "defaultAction": { "type": "uri", "label": "View detail", "uri": "http://example.com/page/111" },
            "actions": [
              { "type": "postback", "label": "Buy", "data": "action=buy&itemid=111" }
            ]
          },
          {
            "thumbnailImageUrl": "https://example.com/item2.jpg",
            "imageBackgroundColor": "#000000",
            "title": "this is menu",
            "text": "description",
            "defaultAction": { "type": "uri", "label": "View detail", "uri": "http://example.com/page/222" },
            "actions": [
              { "type": "postback", "label": "Buy", "data": "action=buy&itemid=222" }
            ]
          }
        ],
        "imageAspectRatio": "rectangle",
        "imageSize": "cover"
      }

      4. Image carousel template
      {
        "columns": [
          {
            "imageUrl": "https://example.com/bot/images/item1.jpg",
            "action": {
              "type": "postback",
              "label": "Buy",
              "data": "action=buy&itemid=111"
            }
          },
          {
            "imageUrl": "https://example.com/bot/images/item2.jpg",
            "action": {
              "type": "message",
              "label": "Yes",
              "text": "yes"
            }
          }
        ]
      }
    */
    create: async ({ name, type, content, created_by }) => {
        const [result] = await pool.query(
            'INSERT INTO templates (name, type, content, created_by) VALUES (?, ?, ?, ?)',
            [name, type, JSON.stringify(content), created_by]
        );
        return result.insertId;
    },

    // ค้นหา Template ทั้งหมด
    findAll: async () => {
        const [rows] = await pool.query('SELECT * FROM templates ORDER BY created_at DESC');
        return rows;
    },

    // ค้นหา Template ตาม ID
    findById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM templates WHERE id = ?', [id]);
        return rows[0] || null;
    },

    // ค้นหา Template ตามประเภท
    findByType: async (type) => {
        const [rows] = await pool.query('SELECT * FROM templates WHERE type = ? ORDER BY created_at DESC', [type]);
        return rows;
    },

    // อัพเดท Template
    update: async (id, { name, type, content }) => {
        const [result] = await pool.query(
            'UPDATE templates SET name = ?, type = ?, content = ? WHERE id = ?',
            [name, type, JSON.stringify(content), id]
        );
        return result.affectedRows > 0;
    },

    // ลบ Template
    deleteById: async (id) => {
        const [result] = await pool.query('DELETE FROM templates WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

module.exports = Template;
