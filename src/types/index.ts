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
  failureCategory: FailureCategory;
  confidence: number;
  resolutionSteps?: string[];
  estimatedFixTime?: number;
}

export enum FailureCategory {
  CONNECTIVITY = 'connectivity',
  PROTOCOL = 'protocol',
  ECU_SPECIFIC = 'ecu_specific',
  ENVIRONMENTAL = 'environmental',
  SECURITY = 'security',
  TIMING = 'timing'
}

export enum ECUType {
  ENGINE = 'engine',
  TRANSMISSION = 'transmission', 
  BODY = 'body',
  GATEWAY = 'gateway',
  ABS = 'abs',
  AIRBAG = 'airbag'
}

export interface ECUState {
  id: string;
  type: ECUType;
  status: 'online' | 'offline' | 'degraded';
  temperature?: number;
  voltage?: number;
  lastResponse?: Date;
  errorCodes?: string[];
  securityLevel?: number;
}

export interface FailureContext {
  service: string;
  subFunction: string;
  targetECU: string;
  ecuType: ECUType;
  sequencePosition: number;
  timing: number;
  previousResponses: DoIPMessage[];
  ecuState: ECUState | undefined;
}

export interface FailurePattern {
  id: string;
  category: FailureCategory;
  pattern: string;
  description: string;
  commonCauses: string[];
  resolutionSteps: string[];
  averageFixTime: number;
  successRate: number;
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