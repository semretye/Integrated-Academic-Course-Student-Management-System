const bcrypt = require('bcrypt');

module.exports = async (password) => {
  return await bcrypt.hash(password, 12);
};