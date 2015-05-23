var models = require('../models/models.js')

// Autoload - factoriza el código si la ruta incluye :quizId
exports.load = function(req,res,next,quizId){
	models.Quiz.find({
			where: { id: Number(quizId) },
			include: [{ model: models.Comment }]
	}).then(
		function(quiz) {
			if (quiz) {
				req.quiz = quiz;
				next();
			} else { next (new Error('No existe quizId=' + quizId)); }
		}
	).catch(function(error) { next(error);});
};

// GET /quizes/question
exports.question = function(req, res) {
	models.Quiz.findAll().success(function(quiz) {
		res.render('quizes/question', {pregunta: quiz[0].pregunta});
	})
};

// // GET /quizes/answer
// exports.answer = function(req, res) {
// 	models.Quiz.findAll().success(function(quiz) {
// 		if (req.query.respuesta === quiz[0].respuesta){
// 			res.render('quizes/answer', {respuesta: 'Correcto'});
// 		} else {
// 			res.render('quizes/answer', {respuesta: 'Incorrecto'});
// 		}	
// 	})
// };

// GET /quizes
exports.index= function(req,res) {
	var options = {};
	if(req.user){
		options.where = {UserId: req.user.id}
	}
	console.log(req.query.search);
	search = req.query.search;
	search2 = "%"+search+"%";
	models.Quiz.findAll(options, {where: ["pregunta like ?", search2]}).then(
	//models.Quiz.findAll().then(
		function(quizes){
			res.render('quizes/index', { quizes: quizes, errors: []});
		}
	).catch(function(error) {next(error);})
};

// GET /quizes/:id
exports.show=function (req, res) {
	res.render('quizes/show', {quiz: req.quiz, errors: []});
};

// GET /quizes/:id/answer
exports.answer= function(req, res) {
	var resultado = 'Incorrecto';
		if (req.query.respuesta === req.quiz.respuesta) {
			resultado = 'Correcto';
		}
		res.render('quizes/answer',	
					{quiz: req.quiz, 
					respuesta: resultado,
					errors: []
				}
			);
};

// GET /quizes/new
exports.new = function(req, res) {
	var quiz = models.Quiz.build( //crea objeto quiz
		{pregunta: "Pregunta", respuesta: "respuesta"}
	);
	res.render('quizes/new', {quiz: quiz, errors: []});
};

// POST /quizes/create
exports.create = function(req, res) {
	req.body.quiz.UserId = req.session.user.id;
	if(req.files.image){
		req.body.quiz.image = req.files.image.name;
	}
	var quiz = models.Quiz.build( req.body.quiz );

	quiz
	.validate()
	.then(
		function(err){
			if(err) {
				res.render('quizes/new', {quiz: quiz, errors: err.errors});
			} else {
				quiz // save: guarda en DB campos pregunta y respuesta de quiz
				.save({fields: ["pregunta", "respuesta", "UserId", "image"]})
				.then( function(){ res.redirect('/quizes')})
			} // Redirección HTTP (URL relativo) lista de preguntas
		}
	);
};

// GET /quizes/:id/edit
exports.edit = function(req, res) {
	var quiz = req.quiz; // autoload de instancia de quiz

	res.render('quizes/edit', {quiz: quiz, errors: []});
};

// PUT /quizes/:id
exports.update = function(req, res) {
	if(req.files.image){
		req.quiz.image = req.files.image.name;
	}
	req.quiz.pregunta = req.body.quiz.pregunta;
	req.quiz.respuesta = req.body.quiz.respuesta;

	req.quiz
	.validate()
	.then(
		function(err){
			if (err) {
				res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
			} else {
				req.quiz // save: guarda campos pregunta y respuesta en DB
				.save( {fields: ["pregunta", "respuesta"]})
				.then( function(){ res.redirect('/quizes');});
			}  // Redirección HTTP a la lista de preguntas (URL relativo)
		}
	);
};

// DELETE /quizes/:id
exports.destroy = function(req, res) {
	req.quiz.destroy().then( function(){
		res.redirect('/quizes');
	}).catch(function(error){next(error)});
};

exports.stats = function(req, res) {
	numPreguntas = 3;
	numComentarios = 5;
	mediaComments = numComentarios/numPreguntas;
	pregSin = 1;
	pregCon = numPreguntas - pregSin;
	res.render('quizes/statistics', {numPreguntas: numPreguntas, 
									numComentarios: numComentarios, 
									mediaComments: mediaComments,
									pregSin:pregSin,
									pregCon:pregCon,
									 errors: []});
}

exports.ownershipRequired = function (req, res, next){
	var objQuizOwner = req.quiz.UserId;
	var logUser = req.session.user.id;
	var isAdmin = req.session.user.isAdmin;

	if (isAdmin || objQuizOwner === logUser){
		next();
	} else {
		res.redirect('/');
	}
};