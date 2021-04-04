import bcrypt from 'bcryptjs';

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    document: '73142800026',
    password: bcrypt.hashSync('123456', 10),
    isAdmin: true,
  },
  {
    name: 'John Doen',
    email: 'john@example.com',
    document: '88402448089',
    password: bcrypt.hashSync('123456', 10),
  },
  {
    name: 'Janne User',
    email: 'janne@example.com',
    document: '70434436011',
    password: bcrypt.hashSync('123456', 10),
  },
];

export default users;
