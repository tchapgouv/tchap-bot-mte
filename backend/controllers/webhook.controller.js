import db from '../models/index.js'

const Webhook = db.webhook;
const Op = db.Sequelize.Op;

// Create and Save a new Webhook
function create (req, res) {
  if (!req.body.room) {
    res.status(400).send({
      message: "Room id can not be empty!"
    });
    return;
  }

  // Create a Webhook
  const webhook = {
    webhook_id: generateId(100),
    webhook_label: req.body.label,
    room_id: req.body.room,
    // room_id: req.body.description,
  };

  // Save Webhook in the database
  Webhook.create(webhook)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating webhook."
      });
    });
}

// Retrieve all Webhooks from the database.
function findAll (req, res) {

  Webhook.findAll()
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

// Retrieve all Webhooks from the database.
function findOneWithWebhook (req, res) {

  return Webhook.findOne({ where: { webhook_id: req.params.webhook } })
}

function generateId (length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export {create, findAll, findOneWithWebhook}
