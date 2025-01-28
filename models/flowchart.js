const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const FlowChartSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        ref: 'User',
    },
    selectInputMethod: {
        type: String,
        required: true,
        enum: ['Text/README', 'Voice Recording', 'Upload Audio'],
    },
    aiModel: {
        type: String,
        required: true,
        enum: ['Gemini', 'Model 2', 'Model 3'],
    },
    textOrMermaid: {
        type: String,
        required: true,
    },
    mermaidString:{
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const FlowChart = mongoose.model('FlowChart', FlowChartSchema);

module.exports = FlowChart;
