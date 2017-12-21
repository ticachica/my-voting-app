const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
    name: { type: String, required: true},
    vote: { type: Number, default: 0}
});

const pollSchema = new mongoose.Schema({
    title: { type: String, required: true},
    code: { type: String, required: true},
    options: [OptionSchema],
    _createdBy: { type: mongoose.Schema.ObjectId, required: true }
});

module.exports = mongoose.model('Poll', pollSchema);