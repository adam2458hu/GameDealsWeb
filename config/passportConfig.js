const bcrypt = require('bcryptjs');
const User = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;

function initialize(passport){
	const userStrategy = async function(email,password,done){
		try {
			const user = await User.findOne({email: email});
			if (!user) {
				done(null,false,'Nem található felhasználó ezzel az email címmel.')
			} else {
				if (!await bcrypt.compare(password,user.password)){
					done(null,false,'Helytelen jelszó');
				} /*else if (!user.confirmed){
					done(null,false,'Kérjük erősítse meg az email címét');
				}*/ else {
					done(null,user);
				}
			}
		} catch(err){
			done(err);
		}
	}

	passport.use(new LocalStrategy({usernameField: 'email'},userStrategy));
}

module.exports = initialize;