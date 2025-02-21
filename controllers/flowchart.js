const asyncHandler = require('express-async-handler');
const FlowChart = require('../models/flowchart');
const axios = require('axios');
require('dotenv').config();

// Function to transcribe audio using an external Whisper API
const transcribeAudio = async (audioBuffer, huggingToken) => {
    try {
        // Sending the audio buffer to the API for transcription
        const response = await axios.post(
            process.env.WHISPER_API_URL,
            audioBuffer,
            {
                headers: {
                    Authorization: `Bearer ${huggingToken}`,
                    'Content-Type': 'application/octet-stream',
                },
            }
        );

        // Return transcribed text if request is successful
        if (response.status === 200) {
            return response.data.text || "Transcription not available.";
        } else {
            throw new Error(`Error: ${response.status}, ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error transcribing audio:', error.message);
        throw error;
    }
};

// Function to extract and clean MermaidJS chart code from API response
function cleanMermaidChart(rawOutput) {
    const mermaidStart = rawOutput.indexOf("```mermaid");
    if (mermaidStart === -1) return "No valid MermaidJS chart found.";

    const chartStart = mermaidStart + 10; // Adjust to remove markdown syntax
    const chartEnd = rawOutput.indexOf("``", chartStart);

    if (chartEnd === -1) return "No valid MermaidJS chart found.";

    return rawOutput.substring(chartStart, chartEnd).trim();
}

// Controller to handle FlowChart creation
const handleCreateFlowChart = asyncHandler(async (req, res) => {
    try {
        const { title, selectInputMethod, aiModel, textOrMermaid, mermaidFile } = req.body;
        const huggingToken = req.headers.huggingtoken;

        // Check if Hugging Face token is provided
        if (!huggingToken) {
            return res.status(400).json({
                status: 400,
                message: 'Hugging token not found.',
            });
        }

        const user_id = req.user._id;
        let file = req.files?.[0];
        let textData = "";

        // Determine input source (text, file, or image)
        if (textOrMermaid) {
            textData = textOrMermaid;
        } else if (file) {
            const fileType = file.mimetype.split('/')[0];

            if (fileType === 'audio') {
                textData = await transcribeAudio(file.buffer, huggingToken);
            } else if (fileType === 'text' || fileType === 'image') {
                textData = file.buffer.toString('utf-8');
                if (fileType === 'image') {
                    textData = 'Analyze this image for flowchart data.';
                }
            } else {
                return res.status(400).json({ message: 'Unsupported file type.' });
            }
        } else {
            return res.status(400).json({ message: 'No input provided.' });
        }

        // Payload for AI model to generate MermaidJS flowchart
        const mistralPayload = {
            inputs: `Generate a clean, simple MermaidJS flowchart with proper syntax. Return only the MermaidJS code:
            ${textData}`,
        };

        // Call AI model API to generate flowchart
        const apiResponse = await axios.post(
            process.env.MISTRAL_API_URL,
            mistralPayload,
            {
                headers: {
                    Authorization: `Bearer ${huggingToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Extract and clean MermaidJS chart from the API response
        const mermaidChart = cleanMermaidChart(apiResponse.data[0].generated_text);

        // Create new FlowChart document and save it to the database
        const flowChart = new FlowChart({
            title,
            selectInputMethod,
            aiModel,
            textOrMermaid,
            mermaidFile,
            mermaidString: mermaidChart,
            user_id,
        });

        await flowChart.save();

        res.status(201).json({
            status: 201,
            message: 'FlowChart created successfully',
            flowChart: flowChart,
        });
    } catch (error) {
        console.error('Error creating FlowChart:', error);
        res.status(500).json({
            status: 500,
            message: 'Failed to create FlowChart',
            error: error,
        });
    }
});

// Controller to fetch all FlowCharts for the logged-in user
const handleGetAllFlowCharts = asyncHandler(async (req, res) => {
    try {
        const flowCharts = await FlowChart.find({ user_id: req.user._id })
            .populate('user_id') // Populate user details
            .sort({ createdAt: -1 }); // Sort by newest first

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

// Controller to fetch a specific FlowChart by ID
const handleGetFlowChartById = asyncHandler(async (req, res) => {
    try {
        const flowChart = await FlowChart.findById(req.params.id)
            .populate('user_id');

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

// Controller to update a FlowChart by ID
const handleUpdateFlowChartById = asyncHandler(async (req, res) => {
    try {
        const { mermaidString } = req.body;

        if (!mermaidString) {
            return res.status(400).json({
                status: 400,
                message: 'mermaidString field is required to update.',
            });
        }

        const flowChart = await FlowChart.findByIdAndUpdate(
            req.params.id,
            { mermaidString },
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

// Controller to delete a FlowChart by ID
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

// Exporting the handlers for use in route definitions
module.exports = {
    handleCreateFlowChart,
    handleGetAllFlowCharts,
    handleGetFlowChartById,
    handleUpdateFlowChartById,
    handleDeleteFlowChartById,
};
