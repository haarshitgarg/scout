import { 
  SimilarFailure, 
  FailureCategory, 
  FailureContext, 
  FailurePattern, 
  ECUType, 
  TestResult,
  ECUState 
} from '../types';
import { ECUManager } from './ecuManager';

export class FailureAnalysisService {
  private static instance: FailureAnalysisService;
  private ecuManager: ECUManager;
  private failurePatterns: FailurePattern[] = [];
  private historicalFailures: TestResult[] = [];

  public static getInstance(): FailureAnalysisService {
    if (!FailureAnalysisService.instance) {
      FailureAnalysisService.instance = new FailureAnalysisService();
    }
    return FailureAnalysisService.instance;
  }

  constructor() {
    this.ecuManager = ECUManager.getInstance();
    this.initializeFailurePatterns();
    this.initializeMockHistoricalData();
  }

  private initializeFailurePatterns(): void {
    this.failurePatterns = [
      {
        id: 'CONN_001',
        category: FailureCategory.CONNECTIVITY,
        pattern: 'no_response',
        description: 'ECU not responding to diagnostic requests',
        commonCauses: ['Network cable disconnected', 'ECU powered down', 'CAN bus failure', 'Network congestion'],
        resolutionSteps: [
          'Check physical network connections',
          'Verify ECU power supply',
          'Test CAN bus continuity',
          'Check for network conflicts'
        ],
        averageFixTime: 15,
        successRate: 0.85
      },
      {
        id: 'PROT_001',
        category: FailureCategory.PROTOCOL,
        pattern: 'invalid_response',
        description: 'ECU sending malformed or unexpected responses',
        commonCauses: ['Firmware corruption', 'Protocol version mismatch', 'Memory corruption'],
        resolutionSteps: [
          'Verify protocol version compatibility',
          'Check ECU firmware version',
          'Perform ECU memory test',
          'Consider firmware update'
        ],
        averageFixTime: 30,
        successRate: 0.70
      },
      {
        id: 'SEC_001',
        category: FailureCategory.SECURITY,
        pattern: 'security_access_denied',
        description: 'Security access request rejected by ECU',
        commonCauses: ['Invalid security key', 'Security timeout', 'ECU in locked state'],
        resolutionSteps: [
          'Verify security key calculation',
          'Check security session timeout',
          'Reset ECU security state',
          'Use correct security level'
        ],
        averageFixTime: 10,
        successRate: 0.90
      },
      {
        id: 'ENV_001',
        category: FailureCategory.ENVIRONMENTAL,
        pattern: 'temperature_failure',
        description: 'ECU failure due to high temperature conditions',
        commonCauses: ['Overheating', 'Cooling system failure', 'High ambient temperature'],
        resolutionSteps: [
          'Check ECU temperature readings',
          'Verify cooling system operation',
          'Allow ECU to cool down',
          'Check for thermal protection activation'
        ],
        averageFixTime: 25,
        successRate: 0.75
      },
      {
        id: 'ENV_002',
        category: FailureCategory.ENVIRONMENTAL,
        pattern: 'voltage_failure',
        description: 'ECU failure due to low voltage conditions',
        commonCauses: ['Battery discharge', 'Alternator failure', 'Wiring resistance'],
        resolutionSteps: [
          'Check battery voltage',
          'Test alternator output',
          'Verify power supply connections',
          'Check for voltage drops in wiring'
        ],
        averageFixTime: 20,
        successRate: 0.80
      },
      {
        id: 'ECU_ENGINE_001',
        category: FailureCategory.ECU_SPECIFIC,
        pattern: 'engine_data_unavailable',
        description: 'Engine ECU data parameters not available',
        commonCauses: ['Sensor failure', 'Engine not running', 'Data not initialized'],
        resolutionSteps: [
          'Start engine and allow warm-up',
          'Check sensor connections',
          'Verify sensor operation',
          'Clear ECU memory and reinitialize'
        ],
        averageFixTime: 12,
        successRate: 0.88
      },
      {
        id: 'ECU_TRANS_001',
        category: FailureCategory.ECU_SPECIFIC,
        pattern: 'transmission_lockout',
        description: 'Transmission ECU in protective lockout mode',
        commonCauses: ['Transmission overheating', 'Hydraulic pressure fault', 'Multiple shift errors'],
        resolutionSteps: [
          'Check transmission fluid temperature',
          'Verify hydraulic pressure',
          'Clear transmission error codes',
          'Perform transmission adaptation'
        ],
        averageFixTime: 35,
        successRate: 0.65
      },
      {
        id: 'TIMING_001',
        category: FailureCategory.TIMING,
        pattern: 'response_timeout',
        description: 'ECU response timeout during communication',
        commonCauses: ['Network latency', 'ECU processing delay', 'Concurrent requests'],
        resolutionSteps: [
          'Increase request timeout value',
          'Reduce concurrent request load',
          'Check network performance',
          'Implement request queuing'
        ],
        averageFixTime: 8,
        successRate: 0.92
      }
    ];
  }

  private initializeMockHistoricalData(): void {
    const mockFailures: TestResult[] = [
      {
        id: 'hist_001',
        sequenceId: 'seq_engine_diag',
        status: 'failure',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        duration: 5000,
        actualResponses: [],
        errorMessage: 'No response from ECU1 for service 22',
        logs: ['ECU1 (engine) high temperature detected', 'Cooling system check recommended']
      },
      {
        id: 'hist_002', 
        sequenceId: 'seq_trans_test',
        status: 'failure',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        duration: 8000,
        actualResponses: [],
        errorMessage: 'Security access denied on ECU2',
        logs: ['Invalid security key used', 'ECU2 security level 2 required']
      },
      {
        id: 'hist_003',
        sequenceId: 'seq_abs_check',
        status: 'failure', 
        timestamp: new Date(Date.now() - 259200000), // 3 days ago
        duration: 12000,
        actualResponses: [],
        errorMessage: 'Response timeout from ECU3',
        logs: ['Network congestion detected', 'Multiple ECUs responding simultaneously']
      }
    ];

    this.historicalFailures = mockFailures;
  }

  public async analyzeSimilarFailures(
    failedResult: TestResult,
    context: FailureContext
  ): Promise<SimilarFailure[]> {
    const patterns = this.identifyFailurePatterns(failedResult, context);
    const suggestions: SimilarFailure[] = [];

    for (const pattern of patterns) {
      const similarFailure: SimilarFailure = {
        testResultId: `pattern_${pattern.id}`,
        similarity: this.calculatePatternSimilarity(pattern, context),
        suggestion: this.generateContextualSuggestion(pattern, context),
        failureCategory: pattern.category,
        confidence: this.calculateConfidence(pattern, context),
        resolutionSteps: pattern.resolutionSteps,
        estimatedFixTime: pattern.averageFixTime,
        resolvedBy: this.getMockResolver(pattern.category)
      };

      suggestions.push(similarFailure);
    }

    // Add historical failure analysis
    const historicalSuggestions = this.analyzeHistoricalFailures(failedResult, context);
    suggestions.push(...historicalSuggestions);

    return suggestions
      .sort((a, b) => (b.similarity * b.confidence) - (a.similarity * a.confidence))
      .slice(0, 5); // Return top 5 suggestions
  }

  private identifyFailurePatterns(result: TestResult, context: FailureContext): FailurePattern[] {
    const matchingPatterns: FailurePattern[] = [];

    if (!result.errorMessage) return matchingPatterns;

    const errorLower = result.errorMessage.toLowerCase();
    
    // Pattern matching based on error message and context
    if (errorLower.includes('no response')) {
      matchingPatterns.push(this.getPatternById('CONN_001')!);
    }

    if (errorLower.includes('security') || errorLower.includes('access denied')) {
      matchingPatterns.push(this.getPatternById('SEC_001')!);
    }

    if (errorLower.includes('timeout')) {
      matchingPatterns.push(this.getPatternById('TIMING_001')!);
    }

    // ECU-specific patterns
    if (context.ecuType === ECUType.ENGINE) {
      if (context.service === '22') {
        matchingPatterns.push(this.getPatternById('ECU_ENGINE_001')!);
      }
    }

    if (context.ecuType === ECUType.TRANSMISSION) {
      matchingPatterns.push(this.getPatternById('ECU_TRANS_001')!);
    }

    // Environmental patterns based on ECU state
    if (context.ecuState) {
      if (context.ecuState.temperature && context.ecuState.temperature > 100) {
        matchingPatterns.push(this.getPatternById('ENV_001')!);
      }
      if (context.ecuState.voltage && context.ecuState.voltage < 12.2) {
        matchingPatterns.push(this.getPatternById('ENV_002')!);
      }
    }

    return matchingPatterns.filter(p => p !== undefined);
  }

  private analyzeHistoricalFailures(result: TestResult, context: FailureContext): SimilarFailure[] {
    const suggestions: SimilarFailure[] = [];

    for (const historical of this.historicalFailures) {
      const similarity = this.calculateHistoricalSimilarity(result, historical, context);
      
      if (similarity > 0.6) { // Only include if similarity is above threshold
        suggestions.push({
          testResultId: historical.id,
          similarity,
          suggestion: this.generateHistoricalSuggestion(historical, context),
          failureCategory: this.categorizeHistoricalFailure(historical),
          confidence: similarity * 0.8, // Historical data gets slightly lower confidence
          resolutionSteps: this.extractResolutionFromLogs(historical.logs),
          estimatedFixTime: this.estimateFixTimeFromHistory(historical),
          resolvedBy: this.getMockHistoricalResolver(historical.id)
        });
      }
    }

    return suggestions;
  }

  private calculatePatternSimilarity(pattern: FailurePattern, context: FailureContext): number {
    let similarity = 0.5; // Base similarity

    // Service-specific similarity
    if (pattern.category === FailureCategory.SECURITY && context.service === '27') {
      similarity += 0.3;
    }

    if (pattern.category === FailureCategory.ECU_SPECIFIC) {
      if (pattern.id.includes('ENGINE') && context.ecuType === ECUType.ENGINE) {
        similarity += 0.4;
      }
      if (pattern.id.includes('TRANS') && context.ecuType === ECUType.TRANSMISSION) {
        similarity += 0.4;
      }
    }

    // Environmental factors
    if (pattern.category === FailureCategory.ENVIRONMENTAL && context.ecuState) {
      if (pattern.id.includes('temperature') && context.ecuState.temperature && context.ecuState.temperature > 90) {
        similarity += 0.3;
      }
      if (pattern.id.includes('voltage') && context.ecuState.voltage && context.ecuState.voltage < 12.3) {
        similarity += 0.3;
      }
    }

    return Math.min(similarity, 1.0);
  }

  private calculateHistoricalSimilarity(
    current: TestResult, 
    historical: TestResult, 
    context: FailureContext
  ): number {
    let similarity = 0.0;

    // Error message similarity (simple keyword matching)
    if (current.errorMessage && historical.errorMessage) {
      const currentWords = current.errorMessage.toLowerCase().split(' ');
      const historicalWords = historical.errorMessage.toLowerCase().split(' ');
      const commonWords = currentWords.filter(word => historicalWords.includes(word));
      similarity += (commonWords.length / Math.max(currentWords.length, historicalWords.length)) * 0.4;
    }

    // Service similarity
    if (historical.logs.some(log => log.includes(context.service))) {
      similarity += 0.3;
    }

    // ECU similarity
    if (historical.logs.some(log => log.toLowerCase().includes(context.ecuType))) {
      similarity += 0.3;
    }

    return Math.min(similarity, 1.0);
  }

  private calculateConfidence(pattern: FailurePattern, context: FailureContext): number {
    let confidence = pattern.successRate;

    // Adjust confidence based on context accuracy
    if (context.ecuState?.status === 'degraded') {
      confidence *= 1.1; // Higher confidence if ECU is known to be degraded
    }

    if (context.sequencePosition > 5) {
      confidence *= 0.9; // Slightly lower confidence for later failures in sequence
    }

    return Math.min(confidence, 1.0);
  }

  private generateContextualSuggestion(pattern: FailurePattern, context: FailureContext): string {
    const ecuInfo = `${context.targetECU} (${context.ecuType})`;
    const serviceInfo = `service ${context.service}`;
    
    switch (pattern.category) {
      case FailureCategory.CONNECTIVITY:
        return `${ecuInfo} connectivity issue detected during ${serviceInfo}. ${pattern.description}`;
      
      case FailureCategory.ENVIRONMENTAL:
        if (context.ecuState?.temperature && context.ecuState.temperature > 100) {
          return `${ecuInfo} showing high temperature (${context.ecuState.temperature.toFixed(1)}°C). ${pattern.description}`;
        }
        if (context.ecuState?.voltage && context.ecuState.voltage < 12.2) {
          return `${ecuInfo} showing low voltage (${context.ecuState.voltage.toFixed(1)}V). ${pattern.description}`;
        }
        return `${ecuInfo} environmental issue detected. ${pattern.description}`;
      
      case FailureCategory.SECURITY:
        return `Security access failure on ${ecuInfo} for ${serviceInfo}. ${pattern.description}`;
      
      case FailureCategory.ECU_SPECIFIC:
        return `${context.ecuType} ECU specific issue on ${serviceInfo}. ${pattern.description}`;
      
      default:
        return `${pattern.description} detected on ${ecuInfo}`;
    }
  }

  private generateHistoricalSuggestion(historical: TestResult, context: FailureContext): string {
    const timeAgo = Math.floor((Date.now() - historical.timestamp.getTime()) / (1000 * 60 * 60 * 24));
    return `Similar failure occurred ${timeAgo} day(s) ago: ${historical.errorMessage}. Check previous resolution in logs.`;
  }

  private getPatternById(id: string): FailurePattern | undefined {
    return this.failurePatterns.find(p => p.id === id);
  }

  private categorizeHistoricalFailure(historical: TestResult): FailureCategory {
    const errorMsg = historical.errorMessage?.toLowerCase() || '';
    
    if (errorMsg.includes('no response') || errorMsg.includes('offline')) {
      return FailureCategory.CONNECTIVITY;
    }
    if (errorMsg.includes('security') || errorMsg.includes('access')) {
      return FailureCategory.SECURITY;
    }
    if (errorMsg.includes('timeout')) {
      return FailureCategory.TIMING;
    }
    if (errorMsg.includes('temperature') || errorMsg.includes('voltage')) {
      return FailureCategory.ENVIRONMENTAL;
    }
    
    return FailureCategory.PROTOCOL;
  }

  private extractResolutionFromLogs(logs: string[]): string[] {
    return logs
      .filter(log => log.includes('check') || log.includes('verify') || log.includes('recommended'))
      .map(log => log.replace(/^\[\d+\]\s*/, '')); // Remove timestamps if present
  }

  private estimateFixTimeFromHistory(historical: TestResult): number {
    const duration = historical.duration;
    if (duration < 5000) return 10;
    if (duration < 10000) return 20;
    return 30;
  }

  private getMockResolver(category: FailureCategory): string {
    const resolvers = {
      [FailureCategory.CONNECTIVITY]: 'Network Team',
      [FailureCategory.PROTOCOL]: 'Diagnostic Specialist',
      [FailureCategory.SECURITY]: 'Security Team', 
      [FailureCategory.ENVIRONMENTAL]: 'Hardware Team',
      [FailureCategory.ECU_SPECIFIC]: 'ECU Specialist',
      [FailureCategory.TIMING]: 'System Administrator'
    };
    
    return resolvers[category] || 'Support Team';
  }

  private getMockHistoricalResolver(resultId: string): string {
    const resolvers = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson'];
    const index = parseInt(resultId.slice(-1)) % resolvers.length;
    return resolvers[index] || 'Unknown Resolver';
  }

  public addHistoricalFailure(result: TestResult): void {
    this.historicalFailures.unshift(result);
    // Keep only last 100 historical failures
    if (this.historicalFailures.length > 100) {
      this.historicalFailures = this.historicalFailures.slice(0, 100);
    }
  }
}