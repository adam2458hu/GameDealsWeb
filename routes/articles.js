if (process.env.NODE_ENV !== 'production'){
	require('dotenv').config();
}

const express = require('express');
const router = express.Router();
const ObjectId = require('mongoose').Types.ObjectId;
const Article = require('../models/article');
const m = require('../config/middlewares');

router.get('/',async(req,res)=>{
	try {
		const articles = await Article.find().sort({createdAt: -1});
		res.status(200).json({articles: articles});
	} catch(err){
		res.status(500).json({message: err.message});
	}
})

router.get('/getArticleBySlug/:slug',async(req,res)=>{
	try {
		const article = await Article.findOne({slug: req.params.slug});
		res.status(200).json({article: article});
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.get('/getTopArticles',async(req,res)=>{
	try {
		const topArticles = await Article.find().sort({views: -1,createdAt: -1}).limit(10);
		res.status(200).json({topArticles: topArticles});
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.get('/articleViewed/:id',async(req,res)=>{
	try {
		await Article.findOneAndUpdate({_id: ObjectId(req.params.id)},{$inc: {views: 1}});
		res.status(200);
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.post('/createArticle',[m.isAuthenticated,m.isAdmin],async(req,res)=>{
	try {
		const newArticle = new Article(req.body.article);
		await newArticle.save();
		res.status(200).json({message: 'articleCreated'});
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.put('/editArticle/:id',[m.isAuthenticated,m.isAdmin],async(req,res)=>{
	try {
		let article = await Article.findById(req.params.id);
		article.title = req.body.article.title;
		article.slug = req.body.article.slug;
		article.lead = req.body.article.lead;
		article.image = req.body.article.image;
		article.body = req.body.article.body;
		await article.save();
		res.status(200).json({message: 'articleEdited'});
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

router.delete('/deleteArticle/:id',[m.isAuthenticated,m.isAdmin],async(req,res)=>{
	try {
		const article = await Article.findById(req.params.id);
		await article.remove();
		res.status(200).json({message: 'articleDeleted'});
	} catch(err) {
		res.status(500).json({message: err.message});
	}
})

module.exports = router;