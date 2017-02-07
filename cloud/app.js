// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();

var parseAdaptor = require('cloud/prerender-parse.js');
app.use(require('cloud/prerenderio.js').setAdaptor(parseAdaptor(Parse)).set('prerenderToken','TOKEN HERE'));

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

app.get('/', function(req, res) {
  res.render('index');
});

// for angular html5mode
app.get('/:pageCalled', function(req, res) {
  // res.header('Content-Type', 'text/html');
  console.log('retrieving page: ' + req.params.pageCalled);
  res.render('index');
});

// Place at Bottom
app.listen();
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
// Parse.Cloud.define("hello", function(request, response) {
//   response.success("Hello world!");
// });