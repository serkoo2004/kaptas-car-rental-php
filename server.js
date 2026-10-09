const http = require("node:http");
const next = require("next");

const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    http
      .createServer((request, response) => handle(request, response))
      .listen(port, hostname, () => {
        console.log(`KAPTAS is listening on http://${hostname}:${port}`);
      });
  })
  .catch((error) => {
    console.error("KAPTAS failed to start", error);
    process.exit(1);
  });
