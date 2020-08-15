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

app.use(cors());
app.use(express.static(__dirname+'/dist/'));
app.use(bodyParser.json());
app.use('/api/users',usersRoutes);
app.use('/api/games',gamesRoutes);
app.use('/api/currencies',currenciesRoutes);
app.use('/api/stores',storesRoutes);
app.get('*', function (req, res){
    res.sendFile(path.join(__dirname+'/dist/index.html'));
});

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true)
mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/users');
mongoose.connection.on('error',(err)=>console.log(err));
mongoose.connection.on('connected',()=>{
	console.log('Connected to mongodb');
	const port = process.env.PORT || 3000;
	app.listen(port,()=>console.log('App is running on port '+port));
});