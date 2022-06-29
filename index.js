require('dotenv').config();
const express = require('express');
const cors = require('cors');
let bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true });

const { Schema } = mongoose;

const ExerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
});

const UserSchema = new Schema({
  username: String
});

const User = mongoose.model("User", UserSchema);
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  const newUser = new User({
    username: req.body.username
  });

  newUser.save((err, data) => {
    if (err | !data) {
      return res.send("Error saving user");
    } else {
      return res.json(data);
    }
  });
});

app.post('/api/users/:id/exercises', (req, res) => {
  const id = req.params.id;
  const { description, duration, date } = req.body;
  User.findById(id, (err, userData) => {
    if (err || !userData) {
      return res.send("Could not find user");
    } else {
      let exerciseDate = "";
      if (date === undefined) {
        exerciseDate = new Date();
      } else {
        exerciseDate = date;
      }
      console.log(exerciseDate);
      const newExercise = new Exercise({
        userId: id,
        description,
        duration,
        date: exerciseDate
      });

      newExercise.save((err, data) => {
        if (err || !userData) {
          return res.send("Error saving exercise");
        } else {
          const { description, duration, date, _id } = data;
          
          return res.json({
            username: userData.username,
            description,
            duration,
            date: date.toDateString(),
            _id: userData.id
          });
        }
      });
    }
  });
});

app.get('/api/users/:id/logs', (req, res) => {
  const { from, to, limit } = req.query;
  const { id } = req.params;

  User.findById(id, (err, userData) => {
    if (err || !userData) {
      return res.send("Could not find user");
    } else {
      let dateObj = {};
      if (from) dateObj["$gte"] = new Date(from); 
      if (to) dateObj["$lte"] = new Date(to);

      let filter = { userId: id }
      
      if (from || to) filter.date = dateObj;

      let nonNullLmit = limit == null ? 500 : limit;
      Exercise.find(filter).limit(nonNullLmit).exec((err, data) => {
        if (err || !data) {
          res.json([]);
        } else {
          const count = data.length;
          const rawLog = data;
          const { username, _id } = userData;
          const log = rawLog.map((l) => ({
            description: l.description,
            duration: l.duration,
            date: l.date.toDateString()
          }));

          return res.json({ username, count, _id, log });
        }
      });
    }
  });
});

app.get('/api/users', (req, res) => {
  User.find({}, (err, data) => {
    if (!data) {
      return res.send("No users");
    } else {
      return res.json(data);
    }
  });
});
                               
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
