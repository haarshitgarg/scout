import express from 'express';
import { Server } from 'socket.io';
import { TestSequence, TestExecution } from '../types';
import { DoIPSimulator } from '../services/doipSimulator';

const router = express.Router();
const simulator = DoIPSimulator.getInstance();

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
        
        // TODO: Add similar failure analysis here
        if (result.status === 'failure') {
          execution.similarFailures = await findSimilarFailures(result);
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

// Mock function for similar failure analysis (to be implemented with vector DB)
async function findSimilarFailures(result: any) {
  // Mock similar failures for demo
  const mockSimilarFailures = [
    {
      testResultId: 'result_1234567890',
      similarity: 0.85,
      suggestion: 'Check ECU power supply. Similar issue resolved by power cycle.',
      resolvedBy: 'John Doe'
    },
    {
      testResultId: 'result_0987654321',
      similarity: 0.72,
      suggestion: 'Verify CAN bus termination. Previous ticket #JIRA-123 had same symptoms.',
      resolvedBy: 'Jane Smith'
    }
  ];
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return result.status === 'failure' ? mockSimilarFailures : [];
}

export default router;