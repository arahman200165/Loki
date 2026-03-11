import crypto from 'crypto';

const sessionsByToken = new Map();

export const createSession = ({ username }) => {
  const token = crypto.randomBytes(48).toString('hex');
  const session = {
    token,
    username,
    createdAt: new Date().toISOString()
  };

  sessionsByToken.set(token, session);
  return session;
};

export const getSession = (token) => sessionsByToken.get(token) || null;

export const deleteSession = (token) => {
  if (!token) {
    return false;
  }

  return sessionsByToken.delete(token);
};
