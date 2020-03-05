let mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
    username: {type:String, default: ''},
    excersize:[{
        description: String,
        duration: Number,
        date: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('User',userSchema);