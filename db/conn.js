const mongoose = require("mongoose");

mongoose.connect(`mongodb+srv://menteshala:menteshala@cluster0.j0pr5hy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).then(()=>console.log("succesfullyconncetedb")).catch(()=>console.log("dbconncetionerror"))