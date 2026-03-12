let user = null;
const api = async (url, method = 'GET', body = null) => (await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : null })).json();
const $ = id => document.getElementById(id);
const toggle = (id, hide) => $(id).classList[hide ? 'add' : 'remove']('hidden');

async function login() {
  const req = await api('/api/login', 'POST', { username: $('username').value, password: $('password').value });
  if (!req.success) return alert('Invalid Credentials');
  user = req.user;
  toggle('login-container', true); toggle('dashboard-container', false);
  $('user-display').innerText = `${user.username} (${user.role})`;
  const isLibrarian = user.role === 'librarian';
  toggle('librarian-panel', !isLibrarian); toggle('issues-panel', !isLibrarian);
  load();
}

async function signup() {
  const [u, p] = [$('username').value, $('password').value];
  if (!u || !p) return alert('Enter username and password');
  if (u === 'admin') return alert('Cannot register as admin');
  const req = await api('/api/signup', 'POST', { username: u, password: p });
  req.success ? (alert('Account created! Logging in...'), login()) : alert(req.message || 'Registration failed');
}

function logout() {
  user = null;
  toggle('login-container', false); toggle('dashboard-container', true);
}

async function load() {
  $('catalog').innerHTML = (await api('/api/books')).map(b => `<div class="item"><div><h4>${b.title}</h4><p>${b.author} | ISBN: ${b.isbn}</p><p>Copies: ${b.available_copies}/${b.total_copies}</p></div><div>${user.role === 'student' && b.available_copies > 0 ? `<button onclick="issue('${b._id}')">Borrow</button>` : ''}</div></div>`).join('');
  if (user.role === 'librarian') $('issues').innerHTML = (await api('/api/issues')).map(i => `<div class="item"><div><h4>Student: ${i.student_name}</h4><p>Book ID: ${i.book_id}</p><p>Due: ${i.due_date} | Status: ${i.status}</p></div><div>${i.status === 'Issued' ? `<button onclick="returnBook('${i._id}')">Return</button>` : ''}</div></div>`).join('');
}

const addBook = async () => { const c = parseInt($('copies').value); await api('/api/books', 'POST', { title: $('title').value, author: $('author').value, isbn: $('isbn').value, available_copies: c, total_copies: c }); load(); };
const issue = async (book_id) => { const d = new Date(), d2 = new Date(d); d2.setDate(d2.getDate() + 14); await api('/api/issue', 'POST', { student_id: user._id, student_name: user.username, book_id, issue_date: d.toISOString().split('T')[0], due_date: d2.toISOString().split('T')[0] }); load(); };
const returnBook = async (id) => { await api('/api/issue/return/' + id, 'PUT'); load(); };
