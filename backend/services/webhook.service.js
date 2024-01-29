import db from '../models/index.js'

const Webhook = db.webhook;
// const Op = db.Sequelize.Op;


// Create and Save a new Webhook
function create (req, res) {
  if (!req.body.room) {
    res.sendStatus(400).send({
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
      res.sendStatus(500).send({
        message:
          err.message || "Some error occurred while creating webhook."
      });
    });
}

function destroy (req, res) {

  const webhookId = req.body.webhook

  return Webhook.destroy({where: {webhook_id: webhookId}})
    .then(status => {
      console.log(status)
      res.status(200).json({
        message: {
          type: 'success',
          title: 'Webhook supprimé',
          description: 'Webhook supprimé avec succès (' + webhookId + ')'
        }
      });
    })
    .catch(err => {
      console.log(err)
      res.sendStatus(500).send({
        message:
          err.message || "Some error occurred while deleting webhook."
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
      res.sendStatus(500).send({
        message:
          err.message || "Some error occurred while retrieving webhooks."
      });
    });
}

// Retrieve all Webhooks from the database.
function findOneWithWebhook (req, _res) {

  return Webhook.findOne({where: {webhook_id: req.params.webhook}})
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

export {create, findAll, findOneWithWebhook, destroy}
