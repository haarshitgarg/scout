import { ECUState, ECUType, DoIPMessage } from '../types';

export class ECUManager {
  private static instance: ECUManager;
  private ecus: Map<string, ECUState> = new Map();

  public static getInstance(): ECUManager {
    if (!ECUManager.instance) {
      ECUManager.instance = new ECUManager();
    }
    return ECUManager.instance;
  }

  constructor() {
    this.initializeECUs();
  }

  private initializeECUs(): void {
    const defaultECUs: ECUState[] = [
      {
        id: 'ECU1',
        type: ECUType.ENGINE,
        status: 'online',
        temperature: 85,
        voltage: 12.4,
        securityLevel: 1,
        errorCodes: []
      },
      {
        id: 'ECU2', 
        type: ECUType.TRANSMISSION,
        status: 'online',
        temperature: 75,
        voltage: 12.3,
        securityLevel: 1,
        errorCodes: []
      },
      {
        id: 'ECU3',
        type: ECUType.ABS,
        status: 'online',
        temperature: 45,
        voltage: 12.5,
        securityLevel: 2,
        errorCodes: []
      },
      {
        id: 'ECU4',
        type: ECUType.BODY,
        status: 'online',
        temperature: 25,
        voltage: 12.4,
        securityLevel: 1,
        errorCodes: []
      },
      {
        id: 'ECU5',
        type: ECUType.GATEWAY,
        status: 'online',
        temperature: 35,
        voltage: 12.6,
        securityLevel: 3,
        errorCodes: []
      }
    ];

    defaultECUs.forEach(ecu => {
      this.ecus.set(ecu.id, ecu);
    });
  }

  public getECU(ecuId: string): ECUState | undefined {
    return this.ecus.get(ecuId);
  }

  public getAllECUs(): ECUState[] {
    return Array.from(this.ecus.values());
  }

  public updateECUStatus(ecuId: string, status: 'online' | 'offline' | 'degraded'): void {
    const ecu = this.ecus.get(ecuId);
    if (ecu) {
      ecu.status = status;
      ecu.lastResponse = new Date();
    }
  }

  public simulateECUConditions(ecuId: string): void {
    const ecu = this.ecus.get(ecuId);
    if (!ecu) return;

    // Simulate environmental changes
    if (ecu.type === ECUType.ENGINE) {
      ecu.temperature = 85 + Math.random() * 30; // 85-115°C
      if (ecu.temperature > 110) {
        ecu.status = 'degraded';
        ecu.errorCodes?.push('P0217'); // Engine overheating
      }
    }

    if (ecu.type === ECUType.TRANSMISSION) {
      ecu.temperature = 75 + Math.random() * 25; // 75-100°C
      if (Math.random() < 0.1) {
        ecu.errorCodes?.push('P0700'); // Transmission control system malfunction
      }
    }

    // Simulate voltage fluctuations
    ecu.voltage = 12.0 + Math.random() * 1.0; // 12.0-13.0V
    if (ecu.voltage < 12.2) {
      ecu.status = 'degraded';
    }

    // Random network issues
    if (Math.random() < 0.05) { // 5% chance
      ecu.status = 'offline';
    }
  }

  public getFailureProbability(ecuId: string, service: string): number {
    const ecu = this.ecus.get(ecuId);
    if (!ecu) return 0.8; // High failure if ECU not found

    let baseProbability = 0.1; // 10% base failure rate

    // Adjust based on ECU status
    switch (ecu.status) {
      case 'offline':
        return 1.0;
      case 'degraded':
        baseProbability += 0.4;
        break;
      case 'online':
        break;
    }

    // Adjust based on ECU type and service
    if (ecu.type === ECUType.ENGINE && service === '22') {
      // Engine diagnostic reads are usually reliable
      baseProbability *= 0.5;
    }

    if (ecu.type === ECUType.GATEWAY && service === '27') {
      // Security access through gateway is more complex
      baseProbability += 0.2;
    }

    // Temperature effects
    if (ecu.temperature && ecu.temperature > 100) {
      baseProbability += 0.3;
    }

    // Voltage effects
    if (ecu.voltage && ecu.voltage < 12.2) {
      baseProbability += 0.2;
    }

    // Security level effects for certain services
    if (service === '27' && ecu.securityLevel && ecu.securityLevel > 2) {
      baseProbability += 0.1;
    }

    return Math.min(baseProbability, 0.9); // Cap at 90%
  }

  public getECUSpecificErrorMessage(ecuId: string, service: string): string {
    const ecu = this.ecus.get(ecuId);
    if (!ecu) return `ECU ${ecuId} not found`;

    if (ecu.status === 'offline') {
      return `ECU ${ecuId} (${ecu.type}) is offline - no response`;
    }

    if (ecu.status === 'degraded') {
      return `ECU ${ecuId} (${ecu.type}) is in degraded state - ${this.getDegradationReason(ecu)}`;
    }

    // Service-specific errors
    switch (service) {
      case '22':
        return `Read data service failed on ${ecu.type} ECU - data identifier not supported`;
      case '27':
        return `Security access denied on ${ecu.type} ECU - insufficient privileges`;
      case '10':
        return `Diagnostic session control failed on ${ecu.type} ECU - session transition not allowed`;
      default:
        return `Service ${service} not supported by ${ecu.type} ECU`;
    }
  }

  private getDegradationReason(ecu: ECUState): string {
    const reasons = [];
    
    if (ecu.temperature && ecu.temperature > 100) {
      reasons.push(`high temperature (${ecu.temperature.toFixed(1)}°C)`);
    }
    
    if (ecu.voltage && ecu.voltage < 12.2) {
      reasons.push(`low voltage (${ecu.voltage.toFixed(1)}V)`);
    }
    
    if (ecu.errorCodes && ecu.errorCodes.length > 0) {
      reasons.push(`error codes: ${ecu.errorCodes.join(', ')}`);
    }

    return reasons.length > 0 ? reasons.join(', ') : 'unknown degradation';
  }
}