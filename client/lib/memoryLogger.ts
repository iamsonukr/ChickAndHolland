let started = false;
let counter = 0;

export function startMemoryLogger() {
  if (started) return;
  started = true;

  setInterval(() => {
    counter++;

    const { heapUsed, rss } = process.memoryUsage();

    
    console.log({
      tick: counter,
      heapUsed: Math.round(heapUsed / 1024 / 1024) + "MB",
      rss: Math.round(rss / 1024 / 1024) + "MB",
    });
  }, 10000);
}
