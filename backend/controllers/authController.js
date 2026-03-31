const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const register = async (req, res) => {
  const { name, email, password, role, specialization, age, gender, blood_group, phone } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  if (!['doctor', 'patient'].includes(role)) {
    return res.status(400).json({ error: 'Role must be doctor or patient.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );

    const user = userResult.rows[0];

    if (role === 'doctor') {
      await client.query(
        'INSERT INTO doctors (user_id, specialization, phone) VALUES ($1, $2, $3)',
        [user.id, specialization || 'General Physician', phone || null]
      );
    } else if (role === 'patient') {
      await client.query(
        'INSERT INTO patients (user_id, age, gender, blood_group, phone) VALUES ($1, $2, $3, $4, $5)',
        [user.id, age || null, gender || null, blood_group || null, phone || null]
      );
    }

    await client.query('COMMIT');

    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Get role-specific id
    let roleId = null;
    if (user.role === 'doctor') {
      const doc = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [user.id]);
      roleId = doc.rows[0]?.id;
    } else {
      const pat = await pool.query('SELECT id FROM patients WHERE user_id = $1', [user.id]);
      roleId = pat.rows[0]?.id;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, roleId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role, roleId } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { register, login, getMe };
