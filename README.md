# 🤖 Kage Bus

A lightweight task router for AI agents / multi-agent orchestration.

## Why?
When you run multiple agents, they:
- Duplicate work
- Step on each other’s tasks
- Return conflicting results

`@kagehq/bus` solves this with a simple **message bus** that:
- Routes each task to one agent
- Handles conflicts with pluggable strategies
- Logs everything for debugging

Running multiple AI agents? 🤖 **Kage Bus** is a **lightweight message bus** that makes sure your agents don't trip over each other.  

- ✅ Simple pub/sub API  
- ✅ Only one agent claims each task  
- ✅ Built-in conflict resolution (`last-writer-wins`)  
- ✅ Local logs for debugging  
 
🔥 Run 5 agents in parallel in 10 lines of code.  


## Installation

```bash
npm install @kagehq/bus
```

## Quick Start

```javascript
//const { createBus } = require("@kagehq/bus");
import { createBus } from "@kagehq/bus";

const bus = createBus();

// Subscribe to a topic
bus.on("task:research", (payload) => {
  console.log("Research agent:", payload.query);
  return { status: "researching", query: payload.query };
});

// Send a message
bus.send("task:research", { query: "latest AI news" });
```

## API Reference

### `createBus(options?)`

Creates a new AgentBus instance.

**Options:**
- `logFile` (string): Path to log file (default: `kage-bus.log`)
- `conflictResolution` (string): Strategy for handling multiple subscribers
  - `'last-writer-wins'` (default): Only the last registered handler processes messages
  - `'first-come-first-serve'`: Only the first registered handler processes messages
  - `'round-robin'`: Rotate through handlers for each message

### `bus.on(topic, handler)`

Subscribe to a topic with a handler function.

**Parameters:**
- `topic` (string): The topic to subscribe to
- `handler` (function): Function to execute when a message is received

**Returns:** Handler ID (string) for unsubscribing

### `bus.off(topic, handlerId)`

Unsubscribe from a topic using the handler ID.

**Parameters:**
- `topic` (string): The topic to unsubscribe from
- `handlerId` (string): The handler ID returned from `on()`

**Returns:** Boolean indicating success

### `bus.send(topic, payload)`

Send a message to a topic.

**Parameters:**
- `topic` (string): The topic to send the message to
- `payload` (object): The message payload

### `bus.getTopics()`

Get all topics that have subscribers.

**Returns:** Array of topic strings

### `bus.getHandlerCount(topic)`

Get the number of handlers for a specific topic.

**Parameters:**
- `topic` (string): The topic to check

**Returns:** Number of handlers

### `bus.clearTopic(topic)`

Clear all handlers for a topic.

**Parameters:**
- `topic` (string): The topic to clear

**Returns:** Boolean indicating success

### `bus.clearAll()`

Clear all handlers for all topics.

## Conflict Resolution Strategies

### Last-Writer-Wins (Default)

Only the most recently registered handler processes messages:

```javascript
const bus = createBus({ conflictResolution: "last-writer-wins" });

bus.on("task:process", (payload) => {
  console.log("First handler"); // Won't execute
});

bus.on("task:process", (payload) => {
  console.log("Second handler"); // Will execute
});

bus.send("task:process", { data: "test" });
```

### First-Come-First-Serve

Only the first registered handler processes messages:

```javascript
const bus = createBus({ conflictResolution: "first-come-first-serve" });

bus.on("task:process", (payload) => {
  console.log("First handler"); // Will execute
});

bus.on("task:process", (payload) => {
  console.log("Second handler"); // Won't execute
});

bus.send("task:process", { data: "test" });
```

### Round-Robin

Rotate through handlers for each message:

```javascript
const bus = createBus({ conflictResolution: "round-robin" });

bus.on("task:process", (payload) => {
  console.log("Handler A");
});

bus.on("task:process", (payload) => {
  console.log("Handler B");
});

// First message: Handler A executes
// Second message: Handler B executes
// Third message: Handler A executes again
bus.send("task:process", { data: "message 1" });
bus.send("task:process", { data: "message 2" });
bus.send("task:process", { data: "message 3" });
```

## Logging

All activities are automatically logged to a JSON file (default: `kage-bus.log`). Each log entry contains:

- `timestamp`: ISO timestamp
- `type`: Activity type (`send`, `subscribe`, `handle`)
- `topic`: The topic involved
- `payload`: Message payload (for send/handle events)
- `handlerId`: Handler identifier (for subscribe/handle events)
- `result`: Handler return value or error (for handle events)

Example log entry:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "type": "handle",
  "topic": "task:research",
  "payload": { "query": "latest AI news" },
  "handlerId": "handler_1",
  "result": { "status": "researching", "query": "latest AI news" }
}
```

## Examples

See the `examples/demo.js` file for a complete demonstration of all features.

```bash
# Run the demo
node examples/demo.js
```

## Roadmap

- ✅ First-claim wins
- ✅ Last-writer-wins conflict strategy
- ⬜ Human-in-the-loop approvals
- ⬜ Cloud-hosted message bus
- ⬜ Multi-tenant orchestration

## License

This project is licensed under the FSL-1.1-MIT License. See the LICENSE file for details.
