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
  } = {}) => {

    if (app === null) {
      throw new Error('app option must be a next server instance')
    }

    if (express === null) {
      throw new Error('express option must be an express server instance')
    }

    // Load body parser to handle POST requests
    express.use(bodyParser.json())
    express.use(bodyParser.urlencoded({extended: true}))

    // Expose a route to return all polls 
    express.get('/polls', (req, res) => {
      Poll.find({}, (err, polls) => {
        if (err)
          return res.status(500).json({error: 'Unable to fetch polls'})
        else if (!polls)
          return res.json({empty: true})
        res.json(polls)
      })
    })  

        // Expose a route to return a single poll 
    express.get('/api/polls/:code', (req, res) => {
      if (req.params.code === null)
        return res.status(500).json({error: 'Unable to fetch this poll'})

      let code = req.params.code;
    
      Poll.findOne({'code': code}, (err, poll) => {
        if (err)
          return res.status(500).json({error: 'Unable to fetch this poll'})
        else if (!poll)
          return res.json({})
        res.json(poll)
      })
    }) 

    // Express route to render the poll details page
    express.get('/polls/:code', (req, res) => {
      let code = req.params.code;
    
      Poll.findOne({'code': req.params.code}, (err, poll) => {
        if (err)
          return res.status(500).json({error: 'Unable to fetch this poll'})
        else if (!poll)
          return res.json({})
        const actualPage = '/details'
        const queryParams = { code: req.params.code } 
        app.render(req, res, actualPage, queryParams)
      })
    }) 

          // Expose a route to return all user polls 
    express.get('/api/mypolls', (req, res) => {
      if (req.user) {
        Poll.find({'_createdBy': req.user.id}, (err, polls) => {
          //Fix to return empty so page knows to say there are no user created polls
          if (err)
            return res.status(500).json({error: 'Unable to fetch user polls'})
          else if (!polls)
            return res.json({})              
          res.json(polls)
        })
      } else {
        return res.status(403).json({error: 'Must be signed in to get your polls'})
      }
    })  

  
      // Expose a route to return all user polls 
      express.get('/mypolls', (req, res) => {
        if (req.user) {
          Poll.find({'_createdBy': req.user.id}, (err, polls) => {
            //Fix to return empty so page knows to say there are no user created polls
            if (err)
              return res.status(500).json({error: 'Unable to fetch user polls'})
            else if (!polls)
              return               
            const actualPage = '/mypolls'
            app.render(req, res, actualPage)
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

      // Expose a route to allow users to create a new poll
      express.post('/vote', (req, res) => {
          console.log(req.body.code)
          let code = req.body.code
          let _id = req.body.id
          let voteCount = req.body.voteCount

          //vote
          Poll.findOneAndUpdate(
            {'code': code, "options._id": _id},
            {
              "$set": {
                "options.$.vote": voteCount
              }
            }, (err, poll) => {
              if (err)
                return res.status(500).json({error: 'Unable to fetch this poll'})
              else if (!poll) 
                return res.status(500).json({error: 'Unable to fetch this poll'})
           });
          //TODO: Make sure it redirects to the poll page with new code
          return res.status(204).redirect('/')
      })
  }

  function getShortCode() {
    //create a random 4 char code
    return rand.generate(4);
  }
