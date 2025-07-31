import { DoIPMessage, TestSequence, TestResult } from '../types';

export class DoIPSimulator {
  private static instance: DoIPSimulator;
  private testResults: TestResult[] = [];

  public static getInstance(): DoIPSimulator {
    if (!DoIPSimulator.instance) {
      DoIPSimulator.instance = new DoIPSimulator();
    }
    return DoIPSimulator.instance;
  }

  // Mock ECU responses based on common DoIP patterns
  private generateMockResponse(message: DoIPMessage): DoIPMessage | null {
    const { service, subFunction, targetECU } = message;
    
    // Simulate common DoIP diagnostic services
    switch (service) {
      case '22': // ReadDataByIdentifier
        if (subFunction === 'D0' && Math.random() > 0.7) {
          // 30% chance of failure for demo purposes
          return null;
        }
        return {
          id: `resp_${Date.now()}`,
          service: '62', // Positive response
          subFunction: subFunction,
          data: this.generateMockData(subFunction),
          targetECU
        };
      
      case '10': // DiagnosticSessionControl
        return {
          id: `resp_${Date.now()}`,
          service: '50', // Positive response
          subFunction: subFunction,
          targetECU
        };
        
      default:
        // Unknown service - simulate error
        if (Math.random() > 0.8) {
          return null;
        }
        return {
          id: `resp_${Date.now()}`,
          service: (parseInt(service, 16) + 0x40).toString(16).toUpperCase(),
          subFunction: subFunction,
          targetECU
        };
    }
  }

  private generateMockData(subFunction: string): string {
    const mockData: Record<string, string> = {
      'D0': '01 02 03 04', // Mock version info
      '5B': 'AA BB CC DD', // Mock sensor data
      '00': 'FF FE FD FC'  // Mock status data
    };
    return mockData[subFunction] || 'DE AD BE EF';
  }

  public async executeTestSequence(
    sequence: TestSequence,
    onProgress?: (progress: number, step: number) => void
  ): Promise<TestResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const actualResponses: DoIPMessage[] = [];
    
    logs.push(`Starting test sequence: ${sequence.name}`);
    logs.push(`Target ECU: ${sequence.messages[0]?.targetECU || 'Unknown'}`);

    for (let i = 0; i < sequence.messages.length; i++) {
      const message = sequence.messages[i]!;
      const progress = ((i + 1) / sequence.messages.length) * 100;
      
      onProgress?.(progress, i + 1);
      
      logs.push(`Sending message ${i + 1}/${sequence.messages.length}: ${message.service} ${message.subFunction}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      const response = this.generateMockResponse(message);
      
      if (!response) {
        // Simulate failure
        const errorMsg = `No response from ECU ${message.targetECU} for service ${message.service}`;
        logs.push(`ERROR: ${errorMsg}`);
        
        const result: TestResult = {
          id: `result_${Date.now()}`,
          sequenceId: sequence.id,
          status: 'failure',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          actualResponses,
          errorMessage: errorMsg,
          logs
        };
        
        this.testResults.push(result);
        return result;
      }
      
      actualResponses.push(response);
      logs.push(`Received response: ${response.service} ${response.subFunction} ${response.data || ''}`);
    }

    const result: TestResult = {
      id: `result_${Date.now()}`,
      sequenceId: sequence.id,
      status: 'success',
      timestamp: new Date(),
      duration: Date.now() - startTime,
      actualResponses,
      logs
    };

    this.testResults.push(result);
    logs.push(`Test sequence completed successfully in ${result.duration}ms`);
    
    return result;
  }

  public getTestResults(): TestResult[] {
    return [...this.testResults];
  }

  public getTestResult(id: string): TestResult | undefined {
    return this.testResults.find(result => result.id === id);
  }
}