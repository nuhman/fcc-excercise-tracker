const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const cors = require('cors');

 
app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const mongoose = require('mongoose');
//mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )
var db;

// mlab_url would be given to you upon registration in mlab.com
var mlab_url = process.env.MLAB_URI;




/*app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
*/

MongoClient.connect(mlab_url, (err, database) => {    
    if(err)  return console.log("error while CONNECTING!! " + err);
    console.log("connected to database!");
    
    db = database;
    
    app.get("/", (req, res) => {        
        var cursor = db.collection('excerciseTracker').find();
        cursor.toArray( (err, results) => {
            if(err) return console.log("error while getting DATA!! " + err);                    
        });
        res.sendFile(process.cwd() + '/views/index.html');
    });
  
    app.post("/api/exercise/new-user", (req, res) => {
      console.log('creating new user ...' + req.body.username);
      
      if(req.body.username){            
        db.collection("excerciseTracker").findOne({user_name: req.body.username}, function(err, user) {
          if (user) { 
            res.send("Sorry! This username is already taken");
          } else {          

            let short_id = (+new Date()).toString(36);

            var save_data = {
                  user_name: req.body.username,            
                  user_id: short_id,
                  details: []
              };
              //res.json(save_data);             
              db.collection('excerciseTracker').save(save_data, (err, result) => {
                  if(err) return console.log("error while uploading DATA!! " + err);
                  console.log("saved to database successfully!");                                                
              }); 

              res.json({"username":req.body.username,"_id":short_id});
          }
        });
      } else {
        res.send("Sorry! You didn't enter any username..");
      }
      
      
        //res.send(req.body.username);
    });
  
    app.post("/api/exercise/add", (req, res) => {
    
    console.log('creating new excerise for user ...' + req.body.userId);
    let userId = req.body.userId;
    
    
    db.collection("excerciseTracker").findOne({user_id: userId}, function(err, user) {
      if (user) { 
        console.log("user exists"); 
        let {status, msg, dateString} = isValidParams(req.body.duration, req.body.date);
        if(status){
          var save_data = {
           "description": req.body.description,
            "duration": req.body.duration,
            "date": req.body.date
          };
          var myquery = { user_id: userId };    
          db.collection("excerciseTracker").updateOne(myquery, { $push: { details: save_data } }, function(err, res) {
            if (err) res.send('Sorry! The id you entered is not valid');
            console.log("1 document updated");      
          });

          res.json(
            {"username":"asdqwer","description":req.body.description,"duration":req.body.duration,"_id":req.body.userId,"date":dateString}
          );
        } else {
          console.log("error with post data"); 
          res.send(msg);
        }
        
        
        
      } else { 
        console.log("user doesn't exist"); 
        res.send('Sorry! The id you entered is not valid');
      }});
    
    
    
    
    
  });
  
    app.get("/api/exercise/log/", (req, res) => {        
        
        let userId = req.query.userId;
        let from = req.query.from;
        let to = req.query.to;
      
        db.collection("excerciseTracker").findOne({ user_id: userId }, function(err, result) {
          if (err) throw err;
          if (result){
            let log = result.details;
            if(from && isValidDate(from)){
                log = log.filter(record => {
                return (new Date(record.date)).getTime() >= (new Date(from)).getTime();
              });
            }
            if(to && isValidDate(to)){
              log = log.filter(record => {
                return (new Date(record.date)).getTime() <= (new Date(to)).getTime();
              });
            }
            //let log = result.details.filter(
            let save_data = {
              "_id": userId,
              "username": result.user_name,
              "count": log.length,
              "log": log
            }
            res.json(save_data);
          } else {
            res.send("unknown userId: " + userId);
          }
          
        });
    });
    
    /*app.get('/api/*', (req, res) => {
        var query = (req.originalUrl).slice(5);
        query = query.split('?')[0];
        var date = (new Date()).toISOString();  
        var off = 0;                        
        if(req.query.offset){            
            off = parseInt(req.query['offset']) + 1;
        }
        console.log(query);
        var save_data = {
            query: decodeURIComponent(query),            
            when: date
        };
        //res.json(save_data);             
        db.collection('imageSearch').save(save_data, (err, result) => {
            if(err) return console.log("error while uploading DATA!! " + err);
            console.log("saved to database successfully!");                                    
            qwant.search("images", { query: query, count: 10, offset: off, language: "english" }, function(err, data){
                if (err) return console.log(err);
                const items = data['data']['result']['items'];            
                var final = [];
                items.map(function(item){
                    final.push(
                        {
                            "image-url": item["media"],
                            "alt-text": item["title"],
                            "page-url": item["url"]
                        }
                    );
                });
                res.json(final);
            }); 
        });        
        
    });*

    app.get('/latest/', (req, res) => {                
        db.collection('imageSearch').find({}, { _id: false, query: true, when: true }).sort({_id:-1}).toArray(function(err, result) {
            if (err) throw err;
            db.close();
            res.json(result);
        });
    });   */         
  
    // Respond not found to all the wrong routes
    app.use(function(req, res, next){
        res.status(404);
        res.sendFile(process.cwd() + '/views/404.html');
    });
  
    // Error Middleware
    app.use(function(err, req, res, next) {
        if(err) {
        res.status(err.status || 500)
            .type('txt')
            .send(err.message || 'SERVER ERROR');
        }  
    });
   
    app.listen(process.env.PORT || 3000, function () {
        console.log('Node.js listening ...');
    });

});

function isValidParams(minutes, date){
  let status = !isNaN(minutes);
  let msg = "";
  let dateString = date;
  if(status){
    // check for date now..
    if(isValidDate(date)){
        let today = new Date(date);        
       dateString = today.toLocaleDateString("en-US", options);
    } else {
       status = false;
       msg = "Cast to Date failed for value " + date + " at path 'date'";
    }
  } else {
    msg = "Cast to Number failed for value '" + minutes + "' at path 'duration'";
  }
  return {
    status,
    msg,
    dateString
  };
}

function isValidDate(date){
    return (Date.parse(date) && !(date.indexOf('/') > -1));
}

const options =  { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };


