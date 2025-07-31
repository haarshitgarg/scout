export interface DoIPMessage {
  id: string;
  service: string;
  subFunction: string;
  data?: string;
  targetECU: string;
}

export interface TestSequence {
  id: string;
  name: string;
  messages: DoIPMessage[];
  expectedResponses: DoIPMessage[];
  timeout: number;
}

export interface TestResult {
  id: string;
  sequenceId: string;
  status: 'success' | 'failure' | 'timeout';
  timestamp: Date;
  duration: number;
  actualResponses: DoIPMessage[];
  errorMessage?: string;
  logs: string[];
}

export interface SimilarFailure {
  testResultId: string;
  similarity: number;
  suggestion: string;
  resolvedBy?: string;
}

export interface TestExecution {
  id: string;
  sequence: TestSequence;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep: number;
  result?: TestResult;
  similarFailures?: SimilarFailure[];
}