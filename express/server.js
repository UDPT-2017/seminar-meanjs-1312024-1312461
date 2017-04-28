// Require functions
var functions = require('./libs/functions.js');

var fs                  = require('fs');
var express             = require('express');
var jade                = require('pug');
var bodyParser          = require('body-parser');
var multipart           = require('connect-multiparty');
var mongoose            = require('mongoose');
var multipartMiddleware = multipart();

// Connect Mongo
mongoose.connect('mongodb://localhost/test');
var dbMongo = mongoose.connection;

var PostSchema = mongoose.Schema({
	title : String,
	slug : String,
	picture : String,
	teaser : String,
	content : String,
	author: String,
	time : Number
});

var Post = mongoose.model('Post', PostSchema);

dbMongo.on('error', console.error.bind(console, 'connection error:'));

dbMongo.once('open', function(){
	console.log('MongoDb connected');
});

// Config app
var app = express();
app.use('/themes/', express.static(__dirname + '/public/'));
app.use('/pictures/', express.static(__dirname + '/public/upload/'));
app.set('views', __dirname + '/views/');
app.set('view engine', 'jade');
app.engine('jade', require('pug').__express);

app.use(bodyParser.urlencoded({
  	extended: true
}));

// Handle request
app.get('/', function(req, res){

	var posts = Post.find({}, function(err, result) {

		// Sort by blog latest
		result = result.sort({'id' : -1});

		res.render('index', { title : 'Home page' , posts : result, functions : functions});
	});

});

app.get('/post/:title/:id.html', function(req, res) {

	var id = req.params.id || 0;

	Post.findById(id, function(err, post) {

		if(post) {
			res.render('post/detail', {title : post.title, post : post});
			return false;
		}

		res.render('404');
	});

});


app.get('/create-post', function(req, res) {
	res.render('post/create', { title : 'Create a post' });
});

app.post('/create-post', multipartMiddleware, function(req, res) {

	var post = new Post;
	post.title = req.body.title;
	post.slug = functions.removeAccent(req.body.title);
	post.teaser = req.body.teaser;
	post.content = req.body.content;

	var file = req.files.picture;

	var originalFilename = file.name;
	var fileType         = file.type.split('/')[1];
	var fileSize         = file.size;
	var pathUpload       = __dirname + '/public/upload/' + originalFilename;

	var data = fs.readFileSync(file.path);
	fs.writeFileSync(pathUpload, data);

	if( fs.existsSync(pathUpload) ) {
		post.picture = originalFilename;
	}

	post.save(function(err, obj) {
		if(!err) {
			res.render('post/create', { status : 'success', message : 'Post successful!' });
			return false;
		}
	});
});


var server = app.listen(process.env.PORT || 3000, function() {
	console.log('Listening on port %d', server.address().port);
});
