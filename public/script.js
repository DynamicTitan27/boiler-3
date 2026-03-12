let user = null;

const api = async (url, method = 'GET', body = null) => {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  return res.json();
};

const $ = id => document.getElementById(id);

async function login() {
  const req = await api('/api/login', 'POST', { username: $('username').value, password: $('password').value });
  if (req.success) {
    user = req.user;
    $('login-container').classList.add('hidden');
    $('dashboard-container').classList.remove('hidden');
    $('user-display').innerText = `${user.username} (${user.role})`;
    if (user.role === 'librarian') {
      $('librarian-panel').classList.remove('hidden');
      $('issues-panel').classList.remove('hidden');
    } else {
      $('librarian-panel').classList.add('hidden');
      $('issues-panel').classList.add('hidden');
    }
    load();
  } else alert('Invalid Credentials');
}

async function signup() {
  const u = $('username').value;
  const p = $('password').value;
  if (!u || !p) return alert('Enter username and password');
  if (u === 'admin') return alert('Cannot register as admin');
  
  const req = await api('/api/signup', 'POST', { username: u, password: p });
  if (req.success) {
    alert('Account created! Logging in...');
    login();
  } else {
    alert(req.message || 'Registration failed');
  }
}

function logout() {
  user = null;
  $('login-container').classList.remove('hidden');
  $('dashboard-container').classList.add('hidden');
}

async function load() {
  const books = await api('/api/books');
  $('catalog').innerHTML = books.map(b => `
    <div class="item">
      <div>
        <h4>${b.title}</h4>
        <p>${b.author} | ISBN: ${b.isbn}</p>
        <p>Copies: ${b.available_copies}/${b.total_copies}</p>
      </div>
      <div>
        ${user.role === 'student' && b.available_copies > 0 ? `<button onclick="issue('${b._id}')">Borrow</button>` : ''}
      </div>
    </div>`).join('');
    
  if (user.role === 'librarian') {
    const issues = await api('/api/issues');
    $('issues').innerHTML = issues.map(i => `
      <div class="item">
        <div>
          <h4>Student: ${i.student_name}</h4>
          <p>Book ID: ${i.book_id}</p>
          <p>Due: ${i.due_date} | Status: ${i.status}</p>
        </div>
        <div>
          ${i.status === 'Issued' ? `<button onclick="returnBook('${i._id}')">Return</button>` : ''}
        </div>
      </div>`).join('');
  }
}

async function addBook() {
  const c = parseInt($('copies').value);
  await api('/api/books', 'POST', { title: $('title').value, author: $('author').value, isbn: $('isbn').value, available_copies: c, total_copies: c });
  load();
}

async function issue(book_id) {
  const d = new Date();
  const d2 = new Date(d);
  d2.setDate(d2.getDate() + 14);
  await api('/api/issue', 'POST', { student_id: user._id, student_name: user.username, book_id, issue_date: d.toISOString().split('T')[0], due_date: d2.toISOString().split('T')[0] });
  load();
}

async function returnBook(id) {
  await api('/api/issue/return/' + id, 'PUT');
  load();
}
