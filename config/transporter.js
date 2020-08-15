const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

const transporter = nodemailer.createTransport(
  {
    host: 'smtp.zoho.eu',
    port: 587,
    secure: false,
    auth: { 
      user: process.env.ZOHO_USER, 
      pass: process.env.ZOHO_PASS
    }
  }
);

const options = {
	viewEngine : {
        extname: '.handlebars',
        layoutsDir: 'views/layouts/',
        defaultLayout: 'layout',
        partialsDir: 'views/partials'
	},
	viewPath : 'views/email'
}

transporter.use('compile',hbs(options));

module.exports = transporter;