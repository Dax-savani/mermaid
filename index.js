
const express = require("express");
const {auth} = require("./middlewares/auth");
const connectionDB = require("./config/connection");
const {notFound, errorHandler} = require("./middlewares/errorHandler");
const app = express();
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 4000;
const cookieParser = require('cookie-parser')
const cors = require('cors');
//routes
const AuthRoutes = require("./routes/auth");
const flowChartRouter = require("./routes/flowchart");
//connection to database
connectionDB(process.env.DB_CONNECTION_STRING);

//Middlewares
app.use(cors({
    origin: 'https://mermaid-fe-lilac.vercel.app',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));

//Routes

app.get("/", (req, res) => {
    res.send("Hello From Server");
});

app.use("/api/linkedin", AuthRoutes);
app.use("/api/",auth, flowChartRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Your Server is running at PORT ${PORT}`);
});
