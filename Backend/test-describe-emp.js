const pool = require('./config/db.js');

(async () => {
  try {
    const [cols] = await pool.query('DESCRIBE EMP');
    console.table(cols);
  } catch(e) {
    console.error(e.message);
  }
  process.exit(0);
})();
