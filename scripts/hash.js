const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.log("Cara pakai: node scripts/hash.js <password>");
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log("Password :", password);
  console.log("Hash     :", hash);
});