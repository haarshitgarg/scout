import express from 'express';
import { Server } from 'socket.io';
import { TestSequence, TestExecution, FailureContext, ECUType } from '../types';
import { DoIPSimulator } from '../services/doipSimulator';
import { FailureAnalysisService } from '../services/failureAnalysis';
import { ECUManager } from '../services/ecuManager';

const router = express.Router();
const simulator = DoIPSimulator.getInstance();
const failureAnalysis = FailureAnalysisService.getInstance();
const ecuManager = ECUManager.getInstance();

// Store active test executions
const activeExecutions = new Map<string, TestExecution>();

// Get all test results
router.get('/results', (req, res) => {
  const results = simulator.getTestResults();
  res.json(results);
});

// Get specific test result
router.get('/results/:id', (req, res) => {
  const result = simulator.getTestResult(req.params.id!);
  if (!result) {
    return res.status(404).json({ error: 'Test result not found' });
  }
  return res.json(result);
});

// Execute a test sequence
router.post('/execute', async (req, res) => {
  try {
    const sequence: TestSequence = req.body;
    const io: Server = req.app.get('io');
    
    // Validate sequence
    if (!sequence.name || !sequence.messages || sequence.messages.length === 0) {
      return res.status(400).json({ error: 'Invalid test sequence' });
    }

    const executionId = `exec_${Date.now()}`;
    const execution: TestExecution = {
      id: executionId,
      sequence,
      status: 'pending',
      progress: 0,
      currentStep: 0
    };

    activeExecutions.set(executionId, execution);
    
    // Return execution ID immediately
    res.json({ executionId, status: 'started' });

    // Start execution asynchronously (don't await)
    (async () => {
      execution.status = 'running';
      io.emit('executionUpdate', execution);

      try {
        const result = await simulator.executeTestSequence(
          sequence,
          (progress, step) => {
            execution.progress = progress;
            execution.currentStep = step;
            io.emit('executionUpdate', execution);
          }
        );

        execution.status = 'completed';
        execution.result = result;
        execution.progress = 100;
        
        // Enhanced failure analysis
        if (result.status === 'failure') {
          execution.similarFailures = await performEnhancedFailureAnalysis(result, sequence);
        }

        io.emit('executionUpdate', execution);

      } catch (error) {
        execution.status = 'failed';
        execution.result = {
          id: `error_${Date.now()}`,
          sequenceId: sequence.id,
          status: 'failure',
          timestamp: new Date(),
          duration: 0,
          actualResponses: [],
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          logs: ['Execution failed with internal error']
        };
        io.emit('executionUpdate', execution);
      }
    })().catch(console.error);

    // Return is needed for TypeScript
    return;

  } catch (error) {
    console.error('Test execution error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get execution status
router.get('/executions/:id', (req, res) => {
  const execution = activeExecutions.get(req.params.id!);
  if (!execution) {
    return res.status(404).json({ error: 'Execution not found' });
  }
  return res.json(execution);
});

// Enhanced failure analysis function
async function performEnhancedFailureAnalysis(result: any, sequence: TestSequence) {
  if (result.status !== 'failure') return [];

  // Find the failed message in the sequence
  const failedMessageIndex = result.actualResponses?.length || 0;
  const failedMessage = sequence.messages[failedMessageIndex];
  
  if (!failedMessage) return [];

  // Get ECU information
  const ecu = ecuManager.getECU(failedMessage.targetECU);
  const ecuType = ecu?.type || ECUType.ENGINE;

  // Create failure context
  const context: FailureContext = {
    service: failedMessage.service,
    subFunction: failedMessage.subFunction,
    targetECU: failedMessage.targetECU,
    ecuType: ecuType,
    sequencePosition: failedMessageIndex,
    timing: result.duration || 0,
    previousResponses: result.actualResponses || [],
    ecuState: ecu
  };

  // Perform enhanced failure analysis
  const similarFailures = await failureAnalysis.analyzeSimilarFailures(result, context);
  
  // Simulate some processing delay for realism
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return similarFailures;
}

// Add new endpoint to get ECU status
router.get('/ecus', (req, res) => {
  const ecus = ecuManager.getAllECUs();
  res.json(ecus);
});

// Add new endpoint to get specific ECU status
router.get('/ecus/:id', (req, res) => {
  const ecu = ecuManager.getECU(req.params.id!);
  if (!ecu) {
    return res.status(404).json({ error: 'ECU not found' });
  }
  return res.json(ecu);
});

export default router;