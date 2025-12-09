const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/quiz.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Get all questions
app.get('/api/questions', (req, res) => {
  db.all('SELECT * FROM questions', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(row => ({ ...row, options: JSON.parse(row.options) })));
  });
});

// Add question
app.post('/api/questions', (req, res) => {
  const { quizId, question, options, correctAnswer } = req.body;
  db.run(
    'INSERT INTO questions (quizId, question, options, correctAnswer) VALUES (?, ?, ?, ?)',
    [quizId, question, JSON.stringify(options), correctAnswer],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, quizId, question, options, correctAnswer });
    }
  );
});

// Edit question
app.put('/api/questions/:id', (req, res) => {
  const { question, options, correctAnswer } = req.body;
  db.run(
    'UPDATE questions SET question = ?, options = ?, correctAnswer = ? WHERE id = ?',
    [question, JSON.stringify(options), correctAnswer, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: req.params.id, question, options, correctAnswer });
    }
  );
});

// Delete question
app.delete('/api/questions/:id', (req, res) => {
  db.run('DELETE FROM questions WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

module.exports = app;


