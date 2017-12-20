'use strict';

const Poll = require('../components/poll');

exports.getPolls = (req, res) => {
    //TODO: Add param of userId to only get polls for a certain user
    Poll.find({}, (err, poll) => {
        if (err)
            res.send(err);
        res.json(poll);
    });
};

exports.createPoll = (req, res) => {
    let new_poll = new Poll(req.body);
    new_poll.save((err,poll) => {
        if (err)
            res.send(err);
        res.json(poll);
    });
};