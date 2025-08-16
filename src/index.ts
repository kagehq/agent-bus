import * as fs from 'fs';
import * as path from 'path';

interface MessagePayload {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  type: 'send' | 'subscribe' | 'handle';
  topic: string;
  payload?: MessagePayload;
  handlerId?: string;
  result?: any;
}

type ConflictResolutionStrategy = 'last-writer-wins' | 'first-come-first-serve' | 'round-robin';

interface BusOptions {
  logFile?: string;
  conflictResolution?: ConflictResolutionStrategy;
}

export class AgentBus {
  private handlers: Map<string, Array<{ id: string; handler: (payload: MessagePayload) => any }>> = new Map();
  private logFile: string;
  private conflictResolution: ConflictResolutionStrategy;
  private roundRobinIndex: Map<string, number> = new Map();
  private handlerCounter = 0;

  constructor(options: BusOptions = {}) {
    this.logFile = options.logFile || 'agent-bus.log';
    this.conflictResolution = options.conflictResolution || 'last-writer-wins';
  }

  /**
   * Subscribe to a topic with a handler function
   * @param topic - The topic to subscribe to
   * @param handler - The handler function to execute when a message is received
   * @returns A unique handler ID that can be used to unsubscribe
   */
  on(topic: string, handler: (payload: MessagePayload) => any): string {
    const handlerId = `handler_${++this.handlerCounter}`;
    
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    
    this.handlers.get(topic)!.push({ id: handlerId, handler });
    
    this.log({
      timestamp: new Date().toISOString(),
      type: 'subscribe',
      topic,
      handlerId
    });

    return handlerId;
  }

  /**
   * Unsubscribe from a topic using the handler ID
   * @param topic - The topic to unsubscribe from
   * @param handlerId - The handler ID returned from the on() method
   */
  off(topic: string, handlerId: string): boolean {
    const topicHandlers = this.handlers.get(topic);
    if (!topicHandlers) {
      return false;
    }

    const initialLength = topicHandlers.length;
    const filteredHandlers = topicHandlers.filter(h => h.id !== handlerId);
    
    if (filteredHandlers.length === initialLength) {
      return false;
    }

    this.handlers.set(topic, filteredHandlers);
    
    if (filteredHandlers.length === 0) {
      this.handlers.delete(topic);
    }

    return true;
  }

  /**
   * Send a message to a topic
   * @param topic - The topic to send the message to
   * @param payload - The message payload
   */
  async send(topic: string, payload: MessagePayload): Promise<void> {
    this.log({
      timestamp: new Date().toISOString(),
      type: 'send',
      topic,
      payload
    });

    const topicHandlers = this.handlers.get(topic);
    if (!topicHandlers || topicHandlers.length === 0) {
      return;
    }

    let handlersToExecute: Array<{ id: string; handler: (payload: MessagePayload) => any }>;

    switch (this.conflictResolution) {
      case 'first-come-first-serve':
        // Only the first handler processes the message
        handlersToExecute = [topicHandlers[0]];
        break;
      
      case 'last-writer-wins':
        // Only the last registered handler processes the message
        handlersToExecute = [topicHandlers[topicHandlers.length - 1]];
        break;
      
      case 'round-robin':
        // Rotate through handlers
        const currentIndex = this.roundRobinIndex.get(topic) || 0;
        const handler = topicHandlers[currentIndex % topicHandlers.length];
        handlersToExecute = [handler];
        this.roundRobinIndex.set(topic, (currentIndex + 1) % topicHandlers.length);
        break;
      
      default:
        handlersToExecute = topicHandlers;
    }

    // Execute the selected handler(s)
    for (const { id, handler } of handlersToExecute) {
      try {
        const result = await handler(payload);
        
        this.log({
          timestamp: new Date().toISOString(),
          type: 'handle',
          topic,
          payload,
          handlerId: id,
          result
        });
      } catch (error) {
        this.log({
          timestamp: new Date().toISOString(),
          type: 'handle',
          topic,
          payload,
          handlerId: id,
          result: { error: error instanceof Error ? error.message : String(error) }
        });
      }
    }
  }

  /**
   * Get all topics that have subscribers
   */
  getTopics(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get the number of handlers for a specific topic
   * @param topic - The topic to check
   */
  getHandlerCount(topic: string): number {
    return this.handlers.get(topic)?.length || 0;
  }

  /**
   * Clear all handlers for a topic
   * @param topic - The topic to clear
   */
  clearTopic(topic: string): boolean {
    return this.handlers.delete(topic);
  }

  /**
   * Clear all handlers for all topics
   */
  clearAll(): void {
    this.handlers.clear();
    this.roundRobinIndex.clear();
  }

  /**
   * Log an entry to the log file
   */
  private log(entry: LogEntry): void {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
}

/**
 * Create a new AgentBus instance
 * @param options - Configuration options for the bus
 * @returns A new AgentBus instance
 */
export function createBus(options?: BusOptions): AgentBus {
  return new AgentBus(options);
}


