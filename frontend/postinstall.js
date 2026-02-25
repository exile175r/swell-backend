const fs = require("fs");
const path = require("path");

const cssInteropBabelPath = path.join(__dirname, "node_modules", "react-native-css-interop", "babel.js");

if (fs.existsSync(cssInteropBabelPath)) {
  let content = fs.readFileSync(cssInteropBabelPath, "utf8");
  if (content.includes('"react-native-worklets/plugin"')) {
    content = content.replace('"react-native-worklets/plugin",', "");
    content = content.replace('"react-native-worklets/plugin"', "");
    fs.writeFileSync(cssInteropBabelPath, content, "utf8");
    console.log("Successfully patched react-native-css-interop/babel.js");
  } else {
    console.log("react-native-worklets/plugin not found in babel.js, skipping patch.");
  }
} else {
  console.log("react-native-css-interop/babel.js not found.");
}
