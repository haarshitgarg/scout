import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar
} from '@mui/material';
import { io, Socket } from 'socket.io-client';
import TestSequenceForm from './components/TestSequenceForm';
import TestExecution from './components/TestExecution';
import TestResults from './components/TestResults';
import { TestExecution as TestExecutionType, TestResult } from './types';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentExecution, setCurrentExecution] = useState<TestExecutionType | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('executionUpdate', (execution: TestExecutionType) => {
      setCurrentExecution(execution);
      
      if (execution.status === 'completed' && execution.result) {
        setTestResults(prev => [execution.result!, ...prev]);
      }
    });

    // Fetch initial test results
    fetchTestResults();

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchTestResults = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/tests/results');
      const results = await response.json();
      setTestResults(results);
    } catch (error) {
      console.error('Failed to fetch test results:', error);
    }
  };

  const handleTestSubmit = async (sequence: any) => {
    try {
      const response = await fetch('http://localhost:3001/api/tests/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sequence),
      });

      if (!response.ok) {
        throw new Error('Failed to start test execution');
      }

      const { executionId } = await response.json();
      console.log('Test execution started:', executionId);
    } catch (error) {
      console.error('Failed to submit test:', error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Scout - DoIP Test Agent POC
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Test Sequence Form */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Create Test Sequence
            </Typography>
            <TestSequenceForm onSubmit={handleTestSubmit} />
          </Paper>

          {/* Current Test Execution */}
          {currentExecution && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Test Execution
              </Typography>
              <TestExecution execution={currentExecution} />
            </Paper>
          )}

          {/* Test Results History */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Test Results History
            </Typography>
            <TestResults results={testResults} />
          </Paper>

        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
