import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore, CheckCircle, Error, Pending } from '@mui/icons-material';
import { TestExecution as TestExecutionType } from '../types';

interface Props {
  execution: TestExecutionType;
}

const TestExecution: React.FC<Props> = ({ execution }) => {
  const getStatusIcon = () => {
    switch (execution.status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      case 'running':
        return <Pending color="primary" />;
      default:
        return <Pending color="disabled" />;
    }
  };

  const getStatusColor = () => {
    switch (execution.status) {
      case 'completed':
        return execution.result?.status === 'success' ? 'success' : 'error';
      case 'failed':
        return 'error';
      case 'running':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Status Overview */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getStatusIcon()}
                <Typography variant="h6">
                  {execution.sequence.name}
                </Typography>
                <Chip 
                  label={execution.status.toUpperCase()} 
                  color={getStatusColor() as any}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progress: {execution.currentStep}/{execution.sequence.messages.length} messages
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={execution.progress} 
                sx={{ mb: 1 }}
              />
              
              <Typography variant="caption" color="text.secondary">
                {Math.round(execution.progress)}% complete
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Test Details */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Details
              </Typography>
              <Typography variant="body2">
                <strong>Target ECU:</strong> {execution.sequence.messages[0]?.targetECU}
              </Typography>
              <Typography variant="body2">
                <strong>Messages:</strong> {execution.sequence.messages.length}
              </Typography>
              <Typography variant="body2">
                <strong>Timeout:</strong> {execution.sequence.timeout}ms
              </Typography>
              {execution.result && (
                <Typography variant="body2">
                  <strong>Duration:</strong> {execution.result.duration}ms
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Logs */}
      {execution.result?.logs && (
        <Box sx={{ mb: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Execution Logs</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {execution.result.logs.map((log, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={log}
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        color: log.includes('ERROR') ? 'error.main' : 'text.primary'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* Similar Failures */}
      {execution.similarFailures && execution.similarFailures.length > 0 && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              🤖 Scout found {execution.similarFailures.length} similar failure(s)
            </Typography>
          </Alert>
          
          {execution.similarFailures.map((failure, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">
                    Similarity: {Math.round(failure.similarity * 100)}%
                  </Typography>
                  {failure.resolvedBy && (
                    <Chip 
                      label={`Resolved by ${failure.resolvedBy}`} 
                      size="small" 
                      color="success"
                    />
                  )}
                </Box>
                <Typography variant="body1">
                  {failure.suggestion}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Reference: {failure.testResultId}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TestExecution;