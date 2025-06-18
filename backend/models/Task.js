// backend/models/Task.js
// MongoDB Schema for tasks

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    },
    tags: [{
        type: String,
        enum: ['work', 'personal', 'family', 'health', 'other'],
        default: 'other'
    }],
    color: {
        type: String,
        default: '#3788d8'
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Task', taskSchema);