// import express from "express";
// import cors from "cors";
// import session from "express-session";
// import db from "./config/Database.js";
// import dotenv from "dotenv";
// import  SequelizeStore  from "connect-session-sequelize";
// import UserRoute from "./routes/UserRoute.js";
// import AuthRoute from "./routes/AuthRoute.js";
// import bodyParser from "body-parser";
// import Users from "./models/UserModel.js";
// import Credentials from "./models/CredentialsModel.js";
// import CredentialsRoute from "./routes/CredentialsRoute.js"
// console.log("hey")
// dotenv.config();

// const app = express();
// app.use(bodyParser.json());

// const sessionStore=SequelizeStore(session.Store);

// const store = new sessionStore({
//     db:db
// });

// (async()=>{
//     await db.sync();
//     await Users.sequelize.sync();
//     await Credentials.sequelize.sync();
// })();
// app.use(session({
//     secret:process.env.SESS_SECRET,
//     resave:false,
//     saveUninitialized:"true",
//     store:store,
//     cookie:{
//         secure:'auto'
//     }
// }))

// app.use(cors({
//     credentials:true,
//     origin:'http://localhost:3000'
// }));

// app.use(express.json());
// app.use(UserRoute);
// app.use(AuthRoute);
// app.use(CredentialsRoute)

// store.sync();

// app.listen(process.env.APP_PORT,()=>{
//     console.log('Server up and runningg....');
// });

import express from "express";
import cors from "cors";
import session from "express-session";
import db from "./config/Database.js";
import dotenv from "dotenv";
import SequelizeStore from "connect-session-sequelize";
import UserRoute from "./routes/UserRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import bodyParser from "body-parser";
import Users from "./models/UserModel.js";



dotenv.config();

const app = express();
app.use(bodyParser.json());

const sessionStore = SequelizeStore(session.Store);

const store = new sessionStore({
  db: db,
});

(async () => {
  await db.sync();
  await Users.sequelize.sync();
})();
app.use(
  session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: "true",
    store: store,
    cookie: {
      secure: "auto",
    },
  })
);

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

app.use(express.json());
app.use(UserRoute);
app.use(AuthRoute);



store.sync();

// -----------------------------------
// New Selenium Route for Login Automation
// -----------------------------------

app.listen(process.env.APP_PORT, () => {
  console.log("Server up and runningg....");
});