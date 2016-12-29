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

var Publicar = mongoose.model("bajada",postear);

var connection_string = '172.30.157.148:27017/sampledb';


var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';


if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  process.env.OPENSHIFT_APP_NAME;
}

mongoose.connect("mongodb://172.30.157.148:27017/sampledb");

app.get('/', function (req, res) {

    res.render('index.jade', { pageCountMessage : null});
  }
);

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


// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});


app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);


