const fs = require("fs");
const path = require("path");

const distPath = path.join(__dirname, "dist", "index.html");
if (fs.existsSync(distPath)) {
  let content = fs.readFileSync(distPath, "utf8");
  // Replace absolute paths with paths relative to the sub-path /Swell/
  content = content.replace(/href="\//g, 'href="/Swell/');
  content = content.replace(/src="\//g, 'src="/Swell/');

  // Fix double slashes if any (though unlikely here)
  content = content.replace(/\/Swell\/\//g, "/Swell/");

  fs.writeFileSync(distPath, content);
  console.log("Successfully patched index.html for GitHub Pages sub-path (/Swell)");
} else {
  console.error("index.html not found in dist folder");
}
