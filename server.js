const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

mongoose.connect('mongodb://127.0.0.1:27017/SmartLibrarySystem1DB');

const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'librarian'], required: true }
}));

const Book = mongoose.model('Book', new mongoose.Schema({
  title: String,
  author: String,
  isbn: String,
  available_copies: Number,
  total_copies: Number
}));

const IssueRecord = mongoose.model('IssueRecord', new mongoose.Schema({
  student_id: mongoose.Schema.Types.ObjectId,
  book_id: mongoose.Schema.Types.ObjectId,
  student_name: String,
  issue_date: String,
  due_date: String,
  status: { type: String, default: 'Issued' }
}));

app.post('/api/signup', async (req, res) => {
  try {
    const user = await User.create({ ...req.body, role: 'student' });
    res.json({ success: true, user });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Username already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username, password: req.body.password });
  if (user) res.json({ success: true, user });
  else res.status(401).json({ success: false });
});

app.post('/api/books', async (req, res) => {
  const book = await Book.create(req.body);
  res.json({ success: true, book });
});

app.get('/api/books', async (req, res) => {
  res.json(await Book.find());
});

app.post('/api/issue', async (req, res) => {
  const record = await IssueRecord.create(req.body);
  await Book.findByIdAndUpdate(req.body.book_id, { $inc: { available_copies: -1 } });
  res.json({ success: true, record });
});

app.put('/api/issue/return/:recordId', async (req, res) => {
  const record = await IssueRecord.findByIdAndUpdate(req.params.recordId, { status: 'Returned' }, { new: true });
  await Book.findByIdAndUpdate(record.book_id, { $inc: { available_copies: 1 } });
  res.json({ success: true, record });
});

app.get('/api/issues', async (req, res) => {
  res.json(await IssueRecord.find());
});

const init = async () => {
  if (await User.countDocuments() === 0) {
    await User.create([
      { username: 'admin', password: '123', role: 'librarian' },
      { username: 'student', password: '123', role: 'student' }
    ]);
  }
};
init().then(() => app.listen(3000, () => console.log('Server running on port 3000')));
