const express = require('express');
const flowChartRouter = express.Router();
const {
    handleCreateFlowChart,
    handleGetAllFlowCharts,
    handleGetFlowChartById,
    handleUpdateFlowChartById,
    handleDeleteFlowChartById,
} = require('../controllers/flowchart');


flowChartRouter.post('/flowchart', handleCreateFlowChart);
flowChartRouter.get('/flowcharts', handleGetAllFlowCharts);
flowChartRouter.get('/flowchart/:id', handleGetFlowChartById);
flowChartRouter.put('/flowchart/:id', handleUpdateFlowChartById);
flowChartRouter.delete('/flowchart/:id', handleDeleteFlowChartById);

module.exports = flowChartRouter;
