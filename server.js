//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    mongoose= require('mongoose'),
    morgan  = require('morgan'),
    bodyParser=require('body-parser'),
    esquema = mongoose.Schema;
    
Object.assign=require('object-assign')

app.set("view engine", "jade");
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

var postear = new esquema({
  comentario: {type: String}
});

var Publicar = mongoose.model("one",postear);

mongoose.connect("mongodb://172.30.157.148:27017/sampledb");


var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_27017'],
      mongoDatabase = process.env[mongoServiceName + '_sampledb'],
      mongoPassword = process.env[mongoServiceName + '_solo']
      mongoUser = process.env[mongoServiceName + '_Fredy'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = '';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      res.render('index.jade', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.jade', { pageCountMessage : null});
  }
});

app.get('/cuenta', function(req,res){
  res.render("menu.jade")
});

app.get("/ver",function(req,res){
  res.render("mostrar.jade")
});

app.post("/ver",function(req,res){
  var data =  new Publicar({
    comentario: req.body.publicacion
  })
  var product = new Publicar(data);
  console.log(data)
  product.save(function(err){
    if(err){
      console.log("no se puede publicar");
    }
    else
      console.log("se realizo una publicacion")
      res.render("mostrar.jade",{product: product})
  })
});

app.get("/all",function(req,res){
  Publicar.find(function(error,documents){
    if(error){console.log(error);}
    res.render("all",{publics : documents})
    console.log(documents)
  })
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
