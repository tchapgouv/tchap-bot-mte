import express from 'express';
import db from './models/index.js'
import webhookApi from './routes/webhook.routes.js';
import userApi from './routes/user.routes.js';
import authApi from './routes/auth.routes.js';
import cors from 'cors';


const app = express()
const vuePath = "./static"

const corsOptions = {origin: true, credentials: true};
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));

app.use(express.static(vuePath));

app.use(webhookApi);
app.use(userApi);
app.use(authApi);

await db.sequelize.sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

await db.user.findOrCreate({
  where: {
    username: 'thomas.bouchardon'
  },
  defaults: {
    username: 'thomas.bouchardon'
  }
})

// simple route
app.get("/", (req, res) => {
  res.json({message: "Welcome to the bot webhook management API."});
});

// set port, listen for requests
const PORT = process.env.PORT || 8085;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
