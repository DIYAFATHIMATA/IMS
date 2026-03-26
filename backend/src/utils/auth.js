import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const signAuthToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyAuthToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const toSafeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt
});
