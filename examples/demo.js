const { createBus } = require("../dist/index.js");

// Create a new bus instance
const bus = createBus();

// Subscribe to the research topic with the primary research agent
bus.on("task:research", (payload) => {
  console.log("Research agent:", payload.query);
  return { status: "researching", query: payload.query };
});

// Subscribe to the same topic with a backup research agent
bus.on("task:research", (payload) => {
  console.log("Backup agent:", payload.query);
  return { status: "backup_researching", query: payload.query };
});

// Send a research task
console.log("Sending research task...");
bus.send("task:research", { query: "latest AI news" });

// Example with different conflict resolution strategies
console.log("\n--- Testing different conflict resolution strategies ---");

// Create a bus with first-come-first-serve strategy
const busFCFS = createBus({ conflictResolution: "first-come-first-serve" });

busFCFS.on("task:process", (payload) => {
  console.log("First handler processing:", payload.data);
  return "first_handler_result";
});

busFCFS.on("task:process", (payload) => {
  console.log("Second handler processing:", payload.data);
  return "second_handler_result";
});

console.log("Sending task with first-come-first-serve strategy...");
busFCFS.send("task:process", { data: "test data" });

// Example with round-robin strategy
console.log("\n--- Testing round-robin strategy ---");

const busRR = createBus({ conflictResolution: "round-robin" });

busRR.on("task:round", (payload) => {
  console.log("Handler A processing:", payload.data);
  return "handler_a_result";
});

busRR.on("task:round", (payload) => {
  console.log("Handler B processing:", payload.data);
  return "handler_b_result";
});

busRR.on("task:round", (payload) => {
  console.log("Handler C processing:", payload.data);
  return "handler_c_result";
});

// Send multiple tasks to see round-robin in action
console.log("Sending multiple tasks with round-robin strategy...");
for (let i = 1; i <= 6; i++) {
  busRR.send("task:round", { data: `task ${i}` });
}

console.log("\nDemo completed! Check kage-bus.log for detailed logs.");
