// Static SPA server used only for local verification of the production export.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve("dist");
const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".json": "application/json",
};
http
  .createServer((req, res) => {
    let filename;
    try {
      filename = path.resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    if (filename !== root && !filename.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!fs.existsSync(filename) || fs.statSync(filename).isDirectory())
      filename = path.join(root, "index.html");
    res.setHeader(
      "Content-Type",
      types[path.extname(filename)] || "application/octet-stream",
    );
    fs.createReadStream(filename)
      .on("error", () => {
        res.writeHead(404);
        res.end();
      })
      .pipe(res);
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("LocalLoop preview: http://127.0.0.1:4173"),
  );
