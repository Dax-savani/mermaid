const asyncHandler = require('express-async-handler');
const FlowChart = require('../models/flowchart');
const axios = require('axios');

const WHISPER_API_URL = "https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo";
const MISTRAL_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;

function generateMermaidChart(apiResponseData) {
    return `
        graph TD
        A[Start] --> B[Process API Response]
        B --> C{Analyze Data}
        C -->|Audio/Text/Image| D[Generate Mermaid Chart]
        D --> E[Send to Frontend]
    `;
}

const handleCreateFlowChart = asyncHandler(async (req, res) => {
    try {
        const file = req.files[0];
        let apiResponse;

        // Check the file type
        const fileType = file.mimetype.split('/')[0];
        console.log("File type:", fileType);

        if (fileType === 'audio') {
            apiResponse = await axios.post(
                WHISPER_API_URL,
                file.buffer,
                {
                    headers: {
                        Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
                        'Content-Type': 'application/octet-stream',
                    },
                }
            );
        } else if (fileType === 'text' || fileType === 'image') {
            const mistralPayload = {
                inputs: fileType === 'text' ? file.buffer.toString('utf-8') : 'Analyze this image for flowchart data.',
            };

            apiResponse = await axios.post(
                MISTRAL_API_URL,
                mistralPayload,
                {
                    headers: {
                        Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        } else {
            return res.status(400).json({ message: 'Unsupported file type.' });
        }

        console.log("API response:", apiResponse.data);

        // Process the response to generate a Mermaid chart string
        const mermaidChart = generateMermaidChart(apiResponse.data);
        console.log("mermaidChartmermaidChartmermaidChart :", mermaidChart);

        res.status(201).json({
            status: 201,
            message: 'FlowChart created successfully',
            mermaidChart,
        });

        res.status(201).json({
            status: 201,
            message: 'FlowChart created successfully',
        });
    } catch (error) {
        console.error('Error creating FlowChart:', error.message);
        res.status(500).json({
            status: 500,
            message: 'Failed to create FlowChart',
            error: error.message,
        });
    }
});

// Get all FlowCharts
const handleGetAllFlowCharts = asyncHandler(async (req, res) => {
    try {
        const flowCharts = await FlowChart.find({}).sort({ createdAt: -1 });

        res.status(200).json({
            status: 200,
            message: 'FlowCharts fetched successfully',
            data: flowCharts,
        });
    } catch (error) {
        console.error('Error fetching FlowCharts:', error.message);
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch FlowCharts',
            error: error.message,
        });
    }
});

// Get FlowChart by ID
const handleGetFlowChartById = asyncHandler(async (req, res) => {
    try {
        const flowChart = await FlowChart.findById(req.params.id);

        if (!flowChart) {
            return res.status(404).json({
                status: 404,
                message: 'FlowChart not found',
            });
        }

        res.status(200).json({
            status: 200,
            message: 'FlowChart fetched successfully',
            data: flowChart,
        });
    } catch (error) {
        console.error('Error fetching FlowChart by ID:', error.message);
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch FlowChart',
            error: error.message,
        });
    }
});

const handleUpdateFlowChartById = asyncHandler(async (req, res) => {
    try {
        const { selectInputMethod, aiModel, textOrMermaid, mermaidFile } = req.body;

        const flowChart = await FlowChart.findByIdAndUpdate(
            req.params.id,
            {
                user_id: req.user._id,
                selectInputMethod,
                aiModel,
                textOrMermaid,
                mermaidFile,
            },
            { new: true }
        );

        if (!flowChart) {
            return res.status(404).json({
                status: 404,
                message: 'FlowChart not found',
            });
        }

        res.status(200).json({
            status: 200,
            message: 'FlowChart updated successfully',
            data: flowChart,
        });
    } catch (error) {
        console.error('Error updating FlowChart:', error.message);
        res.status(500).json({
            status: 500,
            message: 'Failed to update FlowChart',
            error: error.message,
        });
    }
});

// Delete FlowChart by ID with req.user._id
const handleDeleteFlowChartById = asyncHandler(async (req, res) => {
    try {
        const flowChart = await FlowChart.findByIdAndDelete(req.params.id);

        if (!flowChart) {
            return res.status(404).json({
                status: 404,
                message: 'FlowChart not found',
            });
        }

        res.status(200).json({
            status: 200,
            message: 'FlowChart deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting FlowChart:', error.message);
        res.status(500).json({
            status: 500,
            message: 'Failed to delete FlowChart',
            error: error.message,
        });
    }
});

module.exports = {
    handleCreateFlowChart,
    handleGetAllFlowCharts,
    handleGetFlowChartById,
    handleUpdateFlowChartById,
    handleDeleteFlowChartById,
};

