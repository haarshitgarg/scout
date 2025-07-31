import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { DoIPMessage, TestSequence } from '../types';

interface Props {
  onSubmit: (sequence: TestSequence) => void;
}

const TestSequenceForm: React.FC<Props> = ({ onSubmit }) => {
  const [sequenceName, setSequenceName] = useState('');
  const [timeout, setTimeout] = useState(5000);
  const [messages, setMessages] = useState<DoIPMessage[]>([
    {
      id: 'msg_1',
      service: '22',
      subFunction: 'D0',
      data: '5B',
      targetECU: 'ECU1'
    }
  ]);

  const addMessage = () => {
    const newMessage: DoIPMessage = {
      id: `msg_${Date.now()}`,
      service: '22',
      subFunction: 'D0',
      data: '',
      targetECU: 'ECU1'
    };
    setMessages([...messages, newMessage]);
  };

  const updateMessage = (index: number, field: keyof DoIPMessage, value: string) => {
    const updated = [...messages];
    updated[index] = { ...updated[index]!, [field]: value };
    setMessages(updated);
  };

  const removeMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sequenceName.trim() || messages.length === 0) {
      alert('Please provide a sequence name and at least one message');
      return;
    }

    const sequence: TestSequence = {
      id: `seq_${Date.now()}`,
      name: sequenceName,
      messages,
      expectedResponses: [],
      timeout
    };

    onSubmit(sequence);
    
    // Reset form
    setSequenceName('');
    setMessages([{
      id: 'msg_1',
      service: '22',
      subFunction: 'D0',
      data: '5B',
      targetECU: 'ECU1'
    }]);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            label="Test Sequence Name"
            value={sequenceName}
            onChange={(e) => setSequenceName(e.target.value)}
            placeholder="e.g., ECU Status Check"
            required
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            label="Timeout (ms)"
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(Number(e.target.value))}
            inputProps={{ min: 1000, max: 30000 }}
          />
        </Box>
      </Box>

      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        DoIP Messages
      </Typography>

      {messages.map((message, index) => (
        <Paper key={message.id} sx={{ p: 2, mb: 2 }} variant="outlined">
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 150 }}>
              <FormControl fullWidth>
                <InputLabel>Service</InputLabel>
                <Select
                  value={message.service}
                  label="Service"
                  onChange={(e) => updateMessage(index, 'service', e.target.value)}
                >
                  <MenuItem value="22">22 - Read Data</MenuItem>
                  <MenuItem value="10">10 - Session Control</MenuItem>
                  <MenuItem value="27">27 - Security Access</MenuItem>
                  <MenuItem value="2E">2E - Write Data</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 120 }}>
              <TextField
                fullWidth
                label="Sub Function"
                value={message.subFunction}
                onChange={(e) => updateMessage(index, 'subFunction', e.target.value.toUpperCase())}
                placeholder="D0"
                inputProps={{ maxLength: 2 }}
              />
            </Box>
            <Box sx={{ minWidth: 120 }}>
              <TextField
                fullWidth
                label="Data (optional)"
                value={message.data || ''}
                onChange={(e) => updateMessage(index, 'data', e.target.value.toUpperCase())}
                placeholder="5B"
              />
            </Box>
            <Box sx={{ minWidth: 150 }}>
              <FormControl fullWidth>
                <InputLabel>Target ECU</InputLabel>
                <Select
                  value={message.targetECU}
                  label="Target ECU"
                  onChange={(e) => updateMessage(index, 'targetECU', e.target.value)}
                >
                  <MenuItem value="ECU1">ECU1 - Engine</MenuItem>
                  <MenuItem value="ECU2">ECU2 - Transmission</MenuItem>
                  <MenuItem value="ECU3">ECU3 - Body Control</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <IconButton 
                onClick={() => removeMessage(index)}
                disabled={messages.length === 1}
                color="error"
              >
                <Delete />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      ))}

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={addMessage}
        >
          Add Message
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
        >
          Execute Test Sequence
        </Button>
      </Box>
    </Box>
  );
};

export default TestSequenceForm;