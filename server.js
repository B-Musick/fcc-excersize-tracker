const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors')

const mongoose = require('mongoose')
// CONNECT THE DATABASE RUNNING ON DEFAULT PORT 27017
// mongoose.connect(process.env.LOCAL_DATABASE, { useNewUrlParser: true }); 
// mongoose.set( 'useUnifiedTopology', true );


// CONNECT TO MONGODB ATLAS DATABASE - pass URI key to connect
mongoose.connect(process.env.MLAB_URI, {
  userNewUrlParser: true,
  useCreateIndex: true
}).then(() => {
  console.log("Connected to DB!");
}).catch(err => {
  console.log("Error: ", err.message);
});

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// Import models
let User = require('./models/User'); 

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
// Get and create new user
app.post('/api/exercise/new-user',(req,res)=>{
  User.create({username:req.body.username},(err,newUser)=>{
    // Get the user from the POST body and add it to the database
    err? console.log(err):res.json({username:newUser.username,_id:newUser._id});
  });
});

app.get('/api/exercise/users',(req,res)=>{
  User.find({},(err,users)=>{
    // Print all the users and output them {username,_id} which is what map is for
    err ? console.log(err):res.json(users.map(user=>{return {username:user.username,_id:user._id}}))
  });
});

// Add info of excersizes to a user
app.post('/api/exercise/add',(req,res)=>{
  let id = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date; // If no date provided, default will be given
  let userUpdate = { description, duration }; // Create the new object
  if (req.body.date){
    // If a date was provided then add it to the object
    date = req.body.date;
    userUpdate.date = date;
  }
  // Find the user by id and update
  User.findOne({_id:id},(err,user)=>{
    if(err) console.log(err)
    else{
      user.excersize = user.excersize.concat(userUpdate);
      user.save()
      res.json({
        username:user.username,
        _id:user._id,
        excersize:user.excersize[user.excersize.length-1]
      })
    } 
  })
});

app.get('/api/exercise/log',(req,res)=>{
  console.log(req.query);
  
  User.findOne({ _id: req.query.userId }, (err, user) => {
    // Sort all the excersizes from earliest to latest
    let excersize = user.excersize.sort((a,b)=>a.date-b.date); // This will hold the exersizes
    if(req.query.from){
      // Get the from date and filter out any dates coming before this
      let from = new Date(...req.query.from.split('-'))
      excersize = excersize.filter(ex=>{return ex.date>from})
    } 
    if (req.query.to) {
      // Get the 'to' date and filter out any dates coming after this
      let to = new Date(...req.query.to.split('-'))
      excersize = excersize.filter(ex => { return ex.date < to })
    }
    if (req.query.limit){
      // Limit the values returned
      excersize = excersize.slice(0,req.query.limit)
    }
    if (err) console.log(err);
    else {
      res.json({
        username: user.username,
        _id: user._id,
        totalExcersizes: user.excersize.length,
        excersize: excersize
      });
    }
  })
  
})
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
});

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
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
