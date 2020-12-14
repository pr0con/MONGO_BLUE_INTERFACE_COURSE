const bcrypt = require('bcrypt');

async function generateBcryptPassword() {
	let pwd = await bcrypt.hash('SOMEHARDPASSWORD', 10);
	console.log(pwd);
}
generateBcryptPassword();