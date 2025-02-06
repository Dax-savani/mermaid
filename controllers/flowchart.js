const asyncHandler = require('express-async-handler');
const FlowChart = require('../models/flowchart');
const axios = require('axios');
require('dotenv').config();

const transcribeAudio = async (audioBuffer, huggingToken) => {
    try {
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

// function cleanMermaidChart(rawOutput) {
//     console.log(rawOutput);
//     const mermaidStart = rawOutput.indexOf('```mermaid');
//     if (mermaidStart === -1) return "No valid MermaidJS chart found.";
//     const chartStart = rawOutput.indexOf("graph", mermaidStart)
//         || rawOutput.indexOf("sequenceDiagram", mermaidStart)
//         || rawOutput.indexOf("classDiagram", mermaidStart)
//         || rawOutput.indexOf("pieChart", mermaidStart)
//         || rawOutput.indexOf("gantt", mermaidStart)
//         || rawOutput.indexOf("journey", mermaidStart)
//         || rawOutput.indexOf("stateDiagram", mermaidStart)
//         || rawOutput.indexOf("erDiagram", mermaidStart)
//         || rawOutput.indexOf("gitGraph", mermaidStart)
//         || rawOutput.indexOf("mindmap", mermaidStart)
//         || rawOutput.indexOf("requirementDiagram", mermaidStart)
//         || rawOutput.indexOf("flowchart", mermaidStart)
//         || rawOutput.indexOf("diagram", mermaidStart)
//         || rawOutput.indexOf("markdown", mermaidStart)
//         || rawOutput.indexOf("packetDiagram", mermaidStart)
//         || rawOutput.indexOf("c4Diagram", mermaidStart)
//         || rawOutput.indexOf("pieDiagram", mermaidStart)
//         || rawOutput.indexOf("quadrantChart", mermaidStart);
//
//     const chartEnd = rawOutput.indexOf('```', chartStart);
//
//     if (chartStart !== -1 && chartEnd !== -1) {
//         return rawOutput.substring(chartStart, chartEnd).trim();
//     }
//
//     return "No valid MermaidJS chart found.";
// }

function cleanMermaidChart(rawOutput) {
    const mermaidStart = rawOutput.indexOf("```mermaid");
    if (mermaidStart === -1) return "No valid MermaidJS chart found.";

    const chartStart = mermaidStart + 10;

    const chartEnd = rawOutput.indexOf("``", chartStart);
    if (chartEnd === -1) return "No valid MermaidJS chart found.";

    return rawOutput.substring(chartStart, chartEnd).trim();
}


const handleCreateFlowChart = asyncHandler(async (req, res) => {
    try {
        const {title, selectInputMethod, aiModel, textOrMermaid, mermaidFile} = req.body;
        const huggingToken = req.headers.huggingtoken;
        if (!huggingToken) {
            return res.status(400).json({
                status: 400,
                message: 'Hugging token not found.',
            });
        }
        const user_id = req.user._id;

        let file = req.files[0];
        let apiResponse;
        let textData = "";

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
                return res.status(400).json({message: 'Unsupported file type.'});
            }
        } else {
            return res.status(400).json({message: 'No input provided.'});
        }

        const mistralPayload = {
            inputs: `Generate a clean, simple MermaidJS flowchart which is proper in terms of suitable syntax of mermaid js. do not make any mistakes in this Return only the MermaidJS code, no additional information or verbose descriptions for the following: 
            ${textData}`,
        };

        apiResponse = await axios.post(
            process.env.MISTRAL_API_URL,
            mistralPayload,
            {
                headers: {
                    Authorization: `Bearer ${huggingToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        const mermaidChart = cleanMermaidChart(apiResponse.data[0].generated_text);

        const flowChart = new FlowChart({
            title, // Add the title field here
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

const handleGetAllFlowCharts = asyncHandler(async (req, res) => {
    try {
        const flowCharts = await FlowChart.find({ user_id: req.user._id })
            .populate('user_id')
            .sort({ createdAt: -1 });

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


const handleGetFlowChartById = asyncHandler(async (req, res) => {
    try {
        const flowChart = await FlowChart.findById(req.params.id).populate('user_id').sort({createdAt: -1});

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
        const { mermaidString } = req.body;

        if (!mermaidString) {
            return res.status(400).json({
                status: 400,
                message: 'mermaidString field is required to update.',
            });
        }


        const flowChart = await FlowChart.findByIdAndUpdate(
            req.params.id,
            {
                mermaidString,
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

