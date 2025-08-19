import { DoIPMessage, TestSequence, TestResult, ECUType, FailureContext } from '../types';
import { ECUManager } from './ecuManager';
import { FailureAnalysisService } from './failureAnalysis';

export class DoIPSimulator {
  private static instance: DoIPSimulator;
  private testResults: TestResult[] = [];
  private ecuManager: ECUManager;
  private failureAnalysis: FailureAnalysisService;

  public static getInstance(): DoIPSimulator {
    if (!DoIPSimulator.instance) {
      DoIPSimulator.instance = new DoIPSimulator();
    }
    return DoIPSimulator.instance;
  }

  constructor() {
    this.ecuManager = ECUManager.getInstance();
    this.failureAnalysis = FailureAnalysisService.getInstance();
  }

  // Enhanced ECU response generation with realistic behaviors
  private generateMockResponse(message: DoIPMessage, sequencePosition: number = 0): DoIPMessage | null {
    const { service, subFunction, targetECU } = message;
    
    // Update ECU conditions for realistic simulation
    this.ecuManager.simulateECUConditions(targetECU);
    
    // Get ECU state and determine failure probability
    const ecu = this.ecuManager.getECU(targetECU);
    const failureProbability = this.ecuManager.getFailureProbability(targetECU, service);
    
    // Check if this request should fail
    if (Math.random() < failureProbability) {
      return null; // Simulate failure
    }

    // Generate response based on service and ECU type
    return this.generateServiceResponse(service, subFunction, targetECU, ecu?.type);
  }

  private generateServiceResponse(
    service: string, 
    subFunction: string, 
    targetECU: string,
    ecuType?: ECUType
  ): DoIPMessage | null {
    const baseResponse = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      targetECU
    };

    switch (service) {
      case '10': // DiagnosticSessionControl
        return {
          ...baseResponse,
          service: '50', // Positive response
          subFunction: subFunction,
          data: this.generateSessionData(subFunction)
        };

      case '22': // ReadDataByIdentifier  
        return {
          ...baseResponse,
          service: '62', // Positive response
          subFunction: subFunction,
          data: this.generateDataByIdentifier(subFunction, ecuType)
        };

      case '27': // SecurityAccess
        return this.generateSecurityResponse(baseResponse, subFunction, ecuType);

      case '14': // ClearDiagnosticInformation
        return {
          ...baseResponse,
          service: '54', // Positive response
          subFunction: subFunction
        };

      case '19': // ReadDTCInformation
        return {
          ...baseResponse,
          service: '59', // Positive response
          subFunction: subFunction,
          data: this.generateDTCData(ecuType)
        };

      case '2E': // WriteDataByIdentifier
        if (Math.random() > 0.8) { // 20% chance of write failure
          return this.generateNegativeResponse(service, '31'); // Request out of range
        }
        return {
          ...baseResponse,
          service: '6E', // Positive response
          subFunction: subFunction
        };

      case '31': // RoutineControl
        return {
          ...baseResponse,
          service: '71', // Positive response
          subFunction: subFunction,
          data: this.generateRoutineData(subFunction, ecuType)
        };

      default:
        // Unknown service - return negative response
        return this.generateNegativeResponse(service, '11'); // Service not supported
    }
  }

  private generateSessionData(sessionType: string): string {
    const sessionResponses: Record<string, string> = {
      '01': '00 32 01 F4', // Default session with timing parameters
      '02': '00 0A 00 14', // Programming session
      '03': '00 32 01 F4', // Extended diagnostic session
      '81': '00 64 03 E8'  // Custom session
    };
    return sessionResponses[sessionType] || '00 32 01 F4';
  }

  private generateDataByIdentifier(identifier: string, ecuType?: ECUType): string {
    const dataResponses: Record<string, Record<ECUType | string, string>> = {
      'F1 90': { // VIN
        [ECUType.ENGINE]: 'WBA12345678901234',
        [ECUType.TRANSMISSION]: 'WBA12345678901234',
        default: 'WBA12345678901234'
      },
      'F1 8C': { // ECU Serial Number
        [ECUType.ENGINE]: '12345678',
        [ECUType.TRANSMISSION]: '87654321',
        [ECUType.ABS]: 'ABS12345',
        default: 'SN123456'
      },
      'F1 8A': { // Software Version
        [ECUType.ENGINE]: '01.02.03',
        [ECUType.TRANSMISSION]: '02.01.05',
        [ECUType.ABS]: '03.04.01',
        default: '01.00.00'
      },
      'D0 5B': { // Live sensor data
        [ECUType.ENGINE]: this.generateEngineLiveData(),
        [ECUType.TRANSMISSION]: this.generateTransmissionLiveData(),
        [ECUType.ABS]: this.generateABSLiveData(),
        default: 'FF FF FF FF'
      }
    };

    const response = dataResponses[identifier];
    if (response) {
      return response[ecuType || 'default'] || response['default'] || 'FF FF FF FF';
    }

    return this.generateRandomData();
  }

  private generateSecurityResponse(baseResponse: any, level: string, ecuType?: ECUType): DoIPMessage | null {
    const securityLevels: Record<string, number> = {
      '01': 1, // Level 1
      '03': 2, // Level 2  
      '05': 3, // Level 3
    };

    const requiredLevel = securityLevels[level] || 1;
    const ecu = this.ecuManager.getECU(baseResponse.targetECU);
    
    if (ecu && ecu.securityLevel && ecu.securityLevel < requiredLevel) {
      return this.generateNegativeResponse('27', '35'); // Invalid key
    }

    if (level === '01' || level === '03' || level === '05') {
      // Seed request
      return {
        ...baseResponse,
        service: '67',
        subFunction: level,
        data: this.generateSecuritySeed()
      };
    } else {
      // Key response
      return {
        ...baseResponse,
        service: '67',
        subFunction: level
      };
    }
  }

  private generateNegativeResponse(service: string, nrc: string): DoIPMessage {
    return {
      id: `neg_resp_${Date.now()}`,
      service: '7F',
      subFunction: service,
      data: nrc,
      targetECU: 'TESTER'
    };
  }

  private generateEngineLiveData(): string {
    const rpm = (800 + Math.random() * 2000).toFixed(0); // 800-2800 RPM
    const temp = (85 + Math.random() * 25).toFixed(0);   // 85-110°C
    const load = (10 + Math.random() * 80).toFixed(0);   // 10-90% load
    
    return `${parseInt(rpm).toString(16).padStart(4, '0')} ${parseInt(temp).toString(16).padStart(2, '0')} ${parseInt(load).toString(16).padStart(2, '0')}`;
  }

  private generateTransmissionLiveData(): string {
    const gear = Math.floor(Math.random() * 8) + 1;      // Gear 1-8
    const pressure = (2000 + Math.random() * 1000).toFixed(0); // 2000-3000 kPa
    const temp = (75 + Math.random() * 25).toFixed(0);   // 75-100°C
    
    return `${gear.toString(16).padStart(2, '0')} ${parseInt(pressure).toString(16).padStart(4, '0')} ${parseInt(temp).toString(16).padStart(2, '0')}`;
  }

  private generateABSLiveData(): string {
    const frontLeft = (1000 + Math.random() * 500).toFixed(0);  // Wheel speed
    const frontRight = (1000 + Math.random() * 500).toFixed(0);
    const rearLeft = (1000 + Math.random() * 500).toFixed(0);
    const rearRight = (1000 + Math.random() * 500).toFixed(0);
    
    return [frontLeft, frontRight, rearLeft, rearRight]
      .map(speed => parseInt(speed).toString(16).padStart(4, '0'))
      .join(' ');
  }

  private generateDTCData(ecuType?: ECUType): string {
    const dtcCodes: Record<ECUType | string, string[]> = {
      [ECUType.ENGINE]: ['P0171', 'P0301', 'P0442'],
      [ECUType.TRANSMISSION]: ['P0700', 'P0715', 'P0730'],
      [ECUType.ABS]: ['C1234', 'C1235', 'C1241'],
      default: ['U0100', 'U0101']
    };
    
    const codes = dtcCodes[ecuType || 'default'] || dtcCodes['default'] || ['P0000'];
    const selectedCode = codes[Math.floor(Math.random() * codes.length)] || 'P0000';
    
    // Convert DTC to hex format
    const dtcHex = this.dtcToHex(selectedCode || 'P0000');
    return `01 ${dtcHex} 08`; // DTC with status byte
  }

  private generateRoutineData(routineId: string, ecuType?: ECUType): string {
    const routineResponses: Record<string, string> = {
      '01': '00', // Start routine - success
      '02': '01', // Stop routine - success  
      '03': '10 20 30 40' // Request routine results
    };
    
    return routineResponses[routineId] || '00';
  }

  private generateSecuritySeed(): string {
    // Generate 4-byte random seed
    return Array.from({ length: 4 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(' ').toUpperCase();
  }

  private generateRandomData(): string {
    return Array.from({ length: 4 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(' ').toUpperCase();
  }

  private dtcToHex(dtc: string): string {
    // Convert DTC like "P0171" to hex format
    const typeMap: Record<string, string> = {
      'P': '0', 'C': '1', 'B': '2', 'U': '3'
    };
    
    const type = typeMap[dtc[0] || 'P'] || '0';
    const number = dtc.slice(1) || '0000';
    const high = type + number.slice(0, 1);
    const low = number.slice(1);
    
    return `${parseInt(high, 16).toString(16).padStart(2, '0')} ${parseInt(low, 16).toString(16).padStart(2, '0')}`.toUpperCase();
  }

  public async executeTestSequence(
    sequence: TestSequence,
    onProgress?: (progress: number, step: number) => void
  ): Promise<TestResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const actualResponses: DoIPMessage[] = [];
    
    logs.push(`Starting test sequence: ${sequence.name}`);
    logs.push(`Target ECUs: ${[...new Set(sequence.messages.map(m => m.targetECU))].join(', ')}`);

    for (let i = 0; i < sequence.messages.length; i++) {
      const message = sequence.messages[i]!;
      const progress = ((i + 1) / sequence.messages.length) * 100;
      
      onProgress?.(progress, i + 1);
      
      const ecu = this.ecuManager.getECU(message.targetECU);
      logs.push(`Step ${i + 1}/${sequence.messages.length}: Sending ${message.service} ${message.subFunction} to ${message.targetECU} (${ecu?.type || 'unknown'})`);
      
      if (ecu) {
        logs.push(`ECU Status: ${ecu.status}, Temp: ${ecu.temperature?.toFixed(1)}°C, Voltage: ${ecu.voltage?.toFixed(1)}V`);
      }
      
      // Simulate realistic network delay based on ECU type and service
      const delay = this.calculateNetworkDelay(message.service, ecu?.type);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const response = this.generateMockResponse(message, i);
      
      if (!response) {
        // Enhanced failure handling with detailed error message
        const detailedError = this.ecuManager.getECUSpecificErrorMessage(message.targetECU, message.service);
        logs.push(`ERROR: ${detailedError}`);
        
        if (ecu?.status === 'degraded') {
          logs.push(`ECU degradation factors: Temperature ${ecu.temperature?.toFixed(1)}°C, Voltage ${ecu.voltage?.toFixed(1)}V`);
        }
        
        const result: TestResult = {
          id: `result_${Date.now()}`,
          sequenceId: sequence.id,
          status: 'failure',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          actualResponses,
          errorMessage: detailedError,
          logs
        };
        
        this.testResults.push(result);
        this.failureAnalysis.addHistoricalFailure(result);
        return result;
      }
      
      actualResponses.push(response);
      
      // Enhanced response logging
      if (response.service === '7F') {
        // Negative response
        logs.push(`Received negative response: ${response.service} ${response.subFunction} ${response.data} (${this.interpretNRC(response.data || '')})`);
      } else {
        logs.push(`Received positive response: ${response.service} ${response.subFunction} ${response.data || ''}`);
      }

      // Log ECU state changes
      const updatedEcu = this.ecuManager.getECU(message.targetECU);
      if (updatedEcu?.lastResponse) {
        updatedEcu.lastResponse = new Date();
      }
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

  private calculateNetworkDelay(service: string, ecuType?: ECUType): number {
    let baseDelay = 300; // Base 300ms delay
    
    // Service-specific delays
    if (service === '27') baseDelay += 200; // Security access takes longer
    if (service === '31') baseDelay += 500; // Routine control takes longer
    if (service === '2E') baseDelay += 300; // Write operations take longer
    
    // ECU-specific delays
    if (ecuType === ECUType.GATEWAY) baseDelay += 200; // Gateway has routing overhead
    if (ecuType === ECUType.ENGINE && service === '22') baseDelay -= 100; // Engine reads are fast
    
    // Add random variance
    const variance = Math.random() * 200;
    return baseDelay + variance;
  }

  private interpretNRC(nrc: string): string {
    const nrcMappings: Record<string, string> = {
      '10': 'General reject',
      '11': 'Service not supported',
      '12': 'Sub-function not supported',
      '13': 'Incorrect message length',
      '22': 'Conditions not correct',
      '31': 'Request out of range',
      '33': 'Security access denied',
      '35': 'Invalid key',
      '37': 'Required time delay not expired',
      '78': 'Request correctly received - response pending'
    };
    
    return nrcMappings[nrc] || `Unknown NRC: ${nrc}`;
  }

  public getTestResults(): TestResult[] {
    return [...this.testResults];
  }

  public getTestResult(id: string): TestResult | undefined {
    return this.testResults.find(result => result.id === id);
  }
}