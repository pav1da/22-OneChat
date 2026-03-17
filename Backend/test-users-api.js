/**
 * ทดสอบ Users API ทั้ง 10 endpoints
 * วิธีใช้: node test-users-api.js
 */

const BASE_URL = 'http://localhost:3000/api/users';
let TOKEN = '';
let TEST_USER_ID = null;

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('🚀 เริ่มทดสอบ Users API...\n');

  // 1. Register
  console.log('--- #1 POST /register ---');
  const reg = await request('POST', '/register', {
    username: 'testuser',
    email: 'test@onechat.com',
    password: 'test1234'
  });
  console.log(`Status: ${reg.status}`, reg.data.message);
  if (reg.data.token) TOKEN = reg.data.token;
  if (reg.data.user) TEST_USER_ID = reg.data.user.emp_id;
  console.log('');

  // 2. Login
  console.log('--- #2 POST /login ---');
  const login = await request('POST', '/login', {
    email: 'test@onechat.com',
    password: 'test1234'
  });
  console.log(`Status: ${login.status}`, login.data.message);
  if (login.data.token) TOKEN = login.data.token;
  console.log('');

  // 3. Get Me
  console.log('--- #3 GET /me ---');
  const me = await request('GET', '/me', null, TOKEN);
  console.log(`Status: ${me.status}`, me.data);
  console.log('');

  // 4. Update Username
  console.log('--- #4 PUT /me/username ---');
  const uname = await request('PUT', '/me/username', {
    username: 'testuser_updated',
    currentPassword: 'test1234'
  }, TOKEN);
  console.log(`Status: ${uname.status}`, uname.data.message);
  console.log('');

  // 5. Update Email
  console.log('--- #5 PUT /me/email ---');
  const email = await request('PUT', '/me/email', {
    newEmail: 'updated@onechat.com',
    currentPassword: 'test1234'
  }, TOKEN);
  console.log(`Status: ${email.status}`, email.data.message);
  console.log('');

  // 6. Update Phone
  console.log('--- #6 PUT /me/phone ---');
  const phone = await request('PUT', '/me/phone', {
    phone: '099-999-0000'
  }, TOKEN);
  console.log(`Status: ${phone.status}`, phone.data.message);
  console.log('');

  // 7. Update Password
  console.log('--- #7 PUT /me/password ---');
  const pwd = await request('PUT', '/me/password', {
    currentPassword: 'test1234',
    newPassword: 'newpass5678'
  }, TOKEN);
  console.log(`Status: ${pwd.status}`, pwd.data.message);
  console.log('');

  // 8. Avatar (skip — requires FormData)
  console.log('--- #8 PUT /me/avatar --- (SKIP: requires file upload)');
  console.log('');

  // 10. Get All Users (before delete)
  console.log('--- #10 GET / (all users) ---');
  const all = await request('GET', '/', null, TOKEN);
  console.log(`Status: ${all.status}`, Array.isArray(all.data) ? `${all.data.length} users found` : all.data.message);
  console.log('');

  // 9. Delete user
  if (TEST_USER_ID) {
    console.log(`--- #9 DELETE /${TEST_USER_ID} ---`);
    const del = await request('DELETE', `/${TEST_USER_ID}`, null, TOKEN);
    console.log(`Status: ${del.status}`, del.data.message);
  }

  console.log('\n✅ ทดสอบเสร็จสิ้น!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
