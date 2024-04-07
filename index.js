const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require('cookie-parser');
require("./db/conn")
const PORT = process.env.PORT || 3000;
const bodyparsser= require("body-parser");
const bcrypt = require("bcrypt");
const hbs = require("hbs");
const { Server } = require("socket.io");
const http = require('http')
const server = http.createServer(app)


app.use(bodyparsser.urlencoded({extended:true}));

app.set("view engine","hbs");
app.use(cookieParser());
app.use(express.json());

const staticpath = path.join(__dirname,"./public");
app.use(express.static(staticpath));
const templatepath = path.join(__dirname,"./templates/views");
app.set("views",templatepath);

const Mentee = require("./models/menteeregister");
const Mentor = require("./models/mentorregistor");
const { error } = require("console");


const islogin = async (req, res, next) => {
    try {
      if (req.cookies.usermail){
       next(); 
      }
       else {
         res.redirect("/login");
        }
       
    } catch (error) {
      console.log(error.message);
    }
  };




app.get("/login",(req,res)=>{
    res.render("login");
});
app.get("/register",(req,res)=>{
    res.render("reg");
});

app.get("/mentorregister",(req,res)=>{
    res.render("regmentor");
});
app.get("/",(req,res)=>{
    res.render("index");
})


app.get('/mentors',islogin,async(req,res)=>{
    try {
        const usermail = req.cookies.usermail;
        const user = await Mentee.findOne({email:usermail});
        const course = user.course;
        console.log(user);
        console.log(course);
        const mentors = await Mentor.find({course:course});
        console.log(mentors);
        res.render('mentor',{mentors:mentors});  
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


app.get("/find", async (req, res) => {
    try {
        const mentors = await Mentor.find({});

        // Convert experience to lowercase if it exists
        mentors.forEach(mentor => {
            if (mentor.exp !== undefined) {
                mentor.exp = mentor.exp.toLowerCase();
            } else {
                console.log("Experience field is undefined for mentor:", mentor);
            }
        });
        const mentorsJson = JSON.stringify(mentors); // Serialize mentors data to JSON
        res.render('mensearch', { mentorsJson: mentorsJson });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/dashboard',islogin,async (req,res)=>{
    try {
        const usermail = req.cookies.usermail;
        const user = await Mentee.findOne({email:usermail});
        const course = user.course;
        const mentors = await Mentor.find({course:course});
        res.render('dash',{user:user,mentors:mentors,usermail:usermail});  
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

   });


   app.get('/mentordash',islogin,async (req,res)=>{
    try {
        const usermail = req.cookies.usermail;
        
        const user = await Mentor.findOne({email:usermail});
      
       
        res.render('mentordash',{user:user});  
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

   });



app.get('/chatmentor',islogin,(req,res)=>{
res.render('chat');
})
app.get('/chatmentee',islogin,(req,res)=>{
    res.render('menteechat');
    })
////////////////Socket io will start here


const io = new Server(server);
io.on('connection', (socket) => {
    // Event listener for 'user-connected' event
    socket.on('user-connected', (email) => {
        // Set the socket's email property to the user's email
        socket.email = email;
    });

    // Event listener for 'user-message' event
    socket.on('user-message', (data) => {
        const { msg, id } = data; 
        // Check if the recipient's email matches the sender's email
       

       
            console.log(id)
            console.log(socket.email)
             // Emit 'server-message' event only to the recipient
            io.emit('server-message', msg , id);
        
         
       
    });
});











/////////////////////////////socket will end here


    // Request

    app.get('/request',islogin,async (req,res)=>{
        try {
            const usermail = req.cookies.usermail;
            
            const user = await Mentor.findOne({email:usermail});
          
           
            res.render('request',{user:user});  
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    
       });

// register


app.post("/register",async (req,res)=>{
    const status = "online"
    const {fname,lname,email,password,study_level,course} = req.body;
    console.log(req.body);
    const hashedpassword =  await bcrypt.hash(password,10);
    const newmentee = new Mentee({
        fname,
        lname,
        email,
        password:hashedpassword,
        study_level,
        course,
        status
    });
    newmentee.save();
    res.cookie('usermail', email);
    res.status(201).redirect("/dashboard");
   
});

app.post("/mentorregister",async(req,res)=>{
    const status = "online"
    const {fname,lname,email,password,study_level,course,exp} = req.body;
    const hashedpassword =  await bcrypt.hash(password,10);
    const newmentor = new Mentor({
        fname,
        lname,
        email,
        password:hashedpassword,
        study_level,
        course,
        exp,
        status
        
    });
    res.cookie('usermail', email);

    newmentor.save();
    res.redirect('/mentordash')
});

///////-----------Mentor -request
app.post('/request_mentor', async (req, res) => {
    try {
      const mentorEmail = req.cookies.usermail; // Assuming usermail contains the mentor's email
      const newRequestEmail = req.body.email; // Assuming email is the field containing the email to be pushed
       
      if (!mentorEmail || !newRequestEmail) {
        return res.status(400).json({ error: 'Missing mentor email or request email in request' });
      }
  
      // Find the mentor by email
      const mentor = await Mentor.findOne({ email: newRequestEmail });
      if (!mentor) {
        console.log("mentor not found")
        return res.status(404).json({ error: 'Mentor not found' });
      }
      if (mentor.request.includes(mentorEmail)) {
        console.log("Request email already exists for the mentor");
        return res.status(400).json({ error: 'Request email already exists for the mentor' });
      }
      // Push the new request email into the request array
      mentor.request.push(mentorEmail);
      
      // Save the updated mentor document
      const updatedMentor = await mentor.save();
  
      console.log('Updated mentor:', updatedMentor);
      res.status(200).json({ message: 'Mentor request updated successfully', mentor: updatedMentor });
    } catch (error) {
      console.error('Error updating mentor request:', error);
      
      res.status(500).json({ error: 'Error updating mentor request' });
    }
  });
  

// login 



app.post("/login",async(req,res)=>{
  const {email,password} = req.body;
  const user = await Mentee.findOne({email});
  console.log(user);
  if(!user){
    res.status(501).render("login");
  }
  const isvalid = await bcrypt.compare(password,user.password);
  console.log(isvalid);
  if(!isvalid){
    res.status(500).render("login")
  }
  res.cookie('usermail', email);
  res.status(201).redirect("/dashboard")
});

app.post("/mentorlogin",async(req,res)=>{
    const {email,password} = req.body;
    const user = await Mentor.findOne({email});
    console.log(user);
    if(!user){
     return res.status(501).render("login");
    }
    const isvalid = await bcrypt.compare(password,user.password);
    console.log(isvalid);
    if(!isvalid){
    return  res.status(500).render("login",{msg:"⚠ Invalid email or password"})
    }
    res.cookie('usermail', email);
    res.status(201).redirect("/mentordash");
});

app.get("/logout",async(req,res)=>{
    const usrmail = req.cookies.usermail;
   await Mentor.updateMany({email:usrmail},{status:"offline"});
    res.clearCookie("usermail");
    res.redirect("/");
});


server.listen(PORT,()=>console.log(`Listening to port ${PORT}`));