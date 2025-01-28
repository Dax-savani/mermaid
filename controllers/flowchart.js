const asyncHandler = require('express-async-handler');
const FlowChart = require('../models/FlowChart');

// Create a FlowChart with req.user._id
const handleCreateFlowChart = asyncHandler(async (req, res) => {
    try {
        const { selectInputMethod, aiModel, textOrMermaid, mermaidString } = req.body;

        // Ensure req.user._id exists
        if (!req.user || !req.user._id) {
            return res.status(400).json({
                status: 400,
                message: 'User not authenticated',
            });
        }

        const newFlowChart = new FlowChart({
            user_id: req.user._id, // Use req.user._id for the user ID
            selectInputMethod,
            aiModel,
            textOrMermaid,
            mermaidString,
        });

        await newFlowChart.save();

        res.status(201).json({
            status: 201,
            message: 'FlowChart created successfully',
            data: newFlowChart,
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

// Update FlowChart by ID with req.user._id
const handleUpdateFlowChartById = asyncHandler(async (req, res) => {
    try {
        const { selectInputMethod, aiModel, textOrMermaid, mermaidString } = req.body;

        // Ensure req.user._id exists
        if (!req.user || !req.user._id) {
            return res.status(400).json({
                status: 400,
                message: 'User not authenticated',
            });
        }

        const flowChart = await FlowChart.findByIdAndUpdate(
            req.params.id,
            {
                user_id: req.user._id, // Use req.user._id for the user ID
                selectInputMethod,
                aiModel,
                textOrMermaid,
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
