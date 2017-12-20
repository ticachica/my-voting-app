const mongoose = require('mongoose');
const OptionSchema = require('./Option');

const pollSchema = new mongoose.Schema({
    title: { type: String, required: true},
    code: { type: String, required: true},
    _createdBy: { type: Schema.Types.ObjectId, required: true },
    option: [OptionSchema]
});

module.exports = mongoose.model('Poll', pollSchema);