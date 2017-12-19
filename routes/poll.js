'use strict';

const mongooseCrudify = require('mongoose-crudify');
const Poll = require('../components/poll');

//Since DELETE doesn't return the _id of deleted item by default
const addIdToDeleteResults = (req, res, next) => {
    return res. json(req.crudify.err || ( req.method === 'DELETE' ? req.params : req.crudify.result));
};

modules.exports = (server, router) => {
    // Docs: https://github.com/ryo718/mongoose-crudify
    server.use(
        '/polls',
        mongooseCrudify({
            Model: Poll,
            endReponseInAction: false,
            afterActions: [
                {middlewares: [addIdToDeleteResults]},
            ],
        }) 
    );
};