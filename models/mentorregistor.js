const mongoose = require("mongoose");

const Mentorschema = new mongoose.Schema({
    fname:String,
    lname:String,
    email:String,
    password:String,
    study_level:String,
    course:String,
    request:[String],
    exp:String,
    status:{
        type:String,
        default:"Online"
    }
});

module.exports = mongoose.model("Mentor",Mentorschema);