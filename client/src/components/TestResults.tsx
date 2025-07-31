import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { TestResult } from '../types';

interface Props {
  results: TestResult[];
}

interface ResultRowProps {
  result: TestResult;
}

const ResultRow: React.FC<ResultRowProps> = ({ result }) => {
  const [open, setOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failure':
        return 'error';
      case 'timeout':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          {new Date(result.timestamp).toLocaleString()}
        </TableCell>
        <TableCell>
          <Chip 
            label={result.status.toUpperCase()} 
            color={getStatusColor(result.status) as any}
            size="small"
          />
        </TableCell>
        <TableCell>{result.duration}ms</TableCell>
        <TableCell>{result.actualResponses.length}</TableCell>
        <TableCell>
          {result.errorMessage && (
            <Typography variant="caption" color="error">
              {result.errorMessage.substring(0, 50)}...
            </Typography>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Test Details
              </Typography>
              
              {result.errorMessage && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error">
                    Error Message:
                  </Typography>
                  <Typography variant="body2" color="error">
                    {result.errorMessage}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Responses Received ({result.actualResponses.length}):
                </Typography>
                {result.actualResponses.length > 0 ? (
                  <List dense>
                    {result.actualResponses.map((response, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${response.service} ${response.subFunction} ${response.data || ''}`}
                          secondary={`From: ${response.targetECU}`}
                          sx={{ fontFamily: 'monospace' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No responses received
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Execution Logs:
                </Typography>
                <List dense>
                  {result.logs.map((log, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={log}
                        sx={{ 
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          color: log.includes('ERROR') ? 'error.main' : 'text.secondary'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const TestResults: React.FC<Props> = ({ results }) => {
  if (results.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No test results yet. Execute your first test sequence to see results here.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Timestamp</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Responses</TableCell>
            <TableCell>Error</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((result) => (
            <ResultRow key={result.id} result={result} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TestResults;