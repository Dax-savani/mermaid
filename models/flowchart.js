const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const FlowChartSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        ref: 'User',
    },
    title: {
        type: String,
        required: true,
    },
    selectInputMethod: {
        type: String,
        required: false,
        enum: ['Text/README', 'Voice Recording', 'Upload Audio'],
    },
    aiModel: {
        type: String,
        required: true,
        enum: ['Gemini', 'Smart Graph', 'Open AI'],
    },
    textOrMermaid: {
        type: String,
        required: false,
    },
    mermaidString:{
        type: String,
        required: true,
    },
},{timestamps: true});

const FlowChart = mongoose.model('FlowChart', FlowChartSchema);

module.exports = FlowChart;
