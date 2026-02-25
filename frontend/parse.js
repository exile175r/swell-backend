const fs = require("fs");
const d = JSON.parse(fs.readFileSync("err3.json", "utf8"));
const strip = (s) => (s ? s.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "") : "");
fs.writeFileSync("err3.txt", strip(d.out) + "\n" + strip(d.err));
