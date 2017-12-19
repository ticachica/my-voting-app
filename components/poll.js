const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    name: { type: String, required: true},
    vote: { type: Number, default: 0}
});

const pollSchema = new mongoose.Schema({
    title: { type: String, required: true},
    createdBy: { type: Schema.Types.ObjectId, required: true },
    option: [optionSchema]
});

module.exports = mongoose.model('Poll', pollSchema);