var mongoose = require('mongoose'),
    ThreadRangeSchema = new mongoose.Schema({
        threadid: {type: String, ref: 'Thread'},
        skip: Number,
        limit: Number,
        start_date: Date,
        end_date: Date,
        partial: {type: Boolean, default: true},
        length: Number
    });


module.exports = ThreadRangeSchema;
