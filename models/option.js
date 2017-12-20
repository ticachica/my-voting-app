const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
    name: { type: String, required: true},
    vote: { type: Number, default: 0}
});

module.exports = mongoose.model('Option', OptionSchema);