import crypto from 'crypto';

const usersByEmail = new Map();

const scryptAsync = (password, salt, keyLength) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(derivedKey);
    });
  });

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const keyLength = 64;
  const derivedKey = await scryptAsync(password, salt, keyLength);

  return `${salt}:${derivedKey.toString('hex')}`;
};

const verifyPassword = async (password, storedHash) => {
  const [salt, savedKeyHex] = storedHash.split(':');
  if (!salt || !savedKeyHex) {
    return false;
  }

  const savedKey = Buffer.from(savedKeyHex, 'hex');
  const derivedKey = await scryptAsync(password, salt, savedKey.length);

  if (savedKey.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(savedKey, derivedKey);
};

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long.'
      });
    }

    if (usersByEmail.has(normalizedEmail)) {
      return res.status(409).json({
        message: 'Email is already registered.'
      });
    }

    const passwordHash = await hashPassword(password);
    const user = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      name: typeof name === 'string' ? name.trim() : null,
      passwordHash
    };

    usersByEmail.set(normalizedEmail, user);

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      notes: ['Password is hashed with scrypt.', 'Persistence is still in-memory only.']
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to register user.'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    const user = usersByEmail.get(normalizedEmail);
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    return res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token: 'replace-with-real-token',
      notes: ['Token issuing is still a stub.']
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to login user.'
    });
  }
};
