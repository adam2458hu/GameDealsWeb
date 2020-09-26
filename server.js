const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const usersRoutes = require('./routes/users');
const gamesRoutes = require('./routes/games');
const currenciesRoutes = require('./routes/currencies');
const storesRoutes = require('./routes/stores');
const cors = require('cors');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-express-middleware');
const FilesystemBackend = require('i18next-node-fs-backend');

app.use(cors());
app.use(express.static(__dirname+'/dist/', { dotfiles: 'allow' } ));
app.use(bodyParser.json());
app.use('/api/users',usersRoutes);
app.use('/api/games',gamesRoutes);
app.use('/api/currencies',currenciesRoutes);
app.use('/api/stores',storesRoutes);
app.use('/.well-known/pki-validation/4CFDDDDCD306CDC8E0F956EBF799D1C7.txt',express.static(path.join(__dirname,"/.well-known/pki-validation/ADEB8FA1D2BC950635E8103D70176595.txt")))
app.get('*', function (req, res){
    res.sendFile(path.join(__dirname+'/dist/index.html'));
});

//https://github.com/i18next/i18next-express-middleware
i18next
  .use(i18nextMiddleware.LanguageDetector)
  .use(FilesystemBackend)
  .init({
    lng: 'en',
    saveMissing: false,
    debug: false,
    backend: {
      loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json',
      addPath: __dirname + '/locales/{{lng}}/{{ns}}.missing.json'
    },
    nsSeparator: '#||#',
    keySeparator: '#|#',
    detection: {
        order: ['path', 'querystring', 'localStorage','cookie'],
        caches: ['localStorage','cookie'],
        cookieMinutes: 160,
        lookupLocalStorage: 'lang',
        lookupQuerystring: 'lang',
        lookupFromPathIndex: 0
    }
  });
app.use(i18nextMiddleware.handle(i18next));

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true)
mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/users');
mongoose.connection.on('error',(err)=>console.log(err));
mongoose.connection.on('connected',()=>{
	console.log('Connected to mongodb');
	const port = process.env.PORT || 3000;
	app.listen(port,()=>{
		console.log('App is running on port '+port);
		currenciesRoutes.updateExchangeRates();
		setInterval(currenciesRoutes.updateExchangeRates,1000*60*60*3);
		gamesRoutes.refreshGames();
		setInterval(gamesRoutes.refreshGames,1800000);
    usersRoutes.deleteUnverifiedUsers();
    setInterval(usersRoutes.deleteUnverifiedUsers,1800000);
		//usersRoutes.sendWaitlistEmails();
	});
});