#!/usr/bin/env node

if (process.argv[2] === "mcp") {
  if (process.env.SLIPWAY_TEST_MOCK_MCP) {
    console.log("mock mcp started");
    process.exit(0);
  }
  import("node:child_process").then(({ spawn }) => {
    const cp = spawn("npx", ["-y", "@slipway/mcp", ...process.argv.slice(3)], { stdio: "inherit" });
    cp.on("exit", (code) => {
      process.exitCode = code ?? 1;
    });
  });
} else {
  import("../src/cli.mjs").then(({ main }) => main(process.argv.slice(2)).then(code => process.exitCode = code));
}
