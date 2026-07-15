const { execSync } = require("child_process");

function run(cmd, cwd) {
    console.log(`\n> ${cmd}\n`);
    try {
        execSync(cmd, { cwd, stdio: "inherit", shell: true });
        return true;
    } catch {
        return false;
    }
}

console.log("=========================================");
console.log("  BinksConnect — Running All Tests");
console.log("=========================================\n");

let failed = 0;

console.log("--- Server Tests ---");
if (!run("npm test", "server")) failed++;

console.log("\n--- Client Lint ---");
if (!run("npm run lint", "client")) failed++;

console.log("\n--- Client Build ---");
if (!run("npm run build", "client")) failed++;

console.log("\n=========================================");
if (failed > 0) {
    console.log(`  FAILED: ${failed} step(s) failed`);
    process.exit(1);
} else {
    console.log("  ALL PASSED");
    process.exit(0);
}
