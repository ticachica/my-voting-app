'use strict';

const Poll = require('../models/poll');
const Mongoose = require('mongoose');
const bodyParser = require('body-parser')
const rand = require('random-key');

exports.configure = ({
    // Next.js App
    app = null,
    // Express Server
    express = null,
    // MongoDB connection to the user database
    polldb = null,
  } = {}) => {

    if (app === null) {
      throw new Error('app option must be a next server instance')
    }

    if (express === null) {
      throw new Error('express option must be an express server instance')
    }

    if (polldb === null) {
      throw new Error('polldb option must be provided')
    }
    // Load body parser to handle POST requests
    express.use(bodyParser.json())
    express.use(bodyParser.urlencoded({extended: true}))

    // Expose a route to return all polls 
    express.get('/polls', (req, res) => {
      polldb.find({}, (err, polls) => {
        if (err)
          return res.status(500).json({error: 'Unable to fetch polls'})
        else if (!polls)
          return res.json({empty: true})
        res.json(polls)
      })
    })  

    // Expose a route to return all user polls 
    express.get('/mypolls', (req, res) => {
      if (req.user) {
        polldb.find({'_createdBy': req.user.id}, (err, polls) => {
          //Fix to return empty so page knows to say there are no user created polls
          if (err)
            return res.status(500).json({error: 'Unable to fetch user polls'})
          else if (!polls)
            return res.json({empty: true})
            
          res.json(polls)
        })
      } else {
        return res.status(403).json({error: 'Must be signed in to get your polls'})
      }
    })  

    // Expose a route to allow users to create a new poll
    express.post('/newpoll', (req, res) => {
      if (req.user) {
        console.log(req.body)
        //Insert a new poll if the user is signed in
        let newPoll = new Poll;
        newPoll.title = req.body.title;
        newPoll._createdBy = Mongoose.Types.ObjectId(req.body._createdBy);
        //TODO Replace with code create logic here
        newPoll.code = getShortCode();
        let options = req.body.options.split(",");
        console.log(options)
        if (options.length > 0) {
          for(let i=0; i < options.length; i++) {
            newPoll.options.push({ 
              name: options[i]
            });
          }
        }
        newPoll.save(function (err) {
          if (err) return handleError(err)
            console.log('Success!');
        });
        //TODO: Make sure it redirects to the poll page with new code
        return res.status(204).redirect('/')
      } else {
        return res.status(403).json({error: 'Must be signed in to create a poll'})
      }
    })
  }

  function getShortCode() {
    //create a random 4 char code
    return rand.generate(4);
  }