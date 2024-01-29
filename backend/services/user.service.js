import db from "../models/index.js";

const User = db.user;
// const Op = db.Sequelize.Op;

// Retrieve all Webhooks from the database.
function findAll (req, res) {

  User.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving webhooks."
      });
    });
}

export {findAll}
