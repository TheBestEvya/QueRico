import initApp from "./server";
import { initializeSocket } from '../src/services/socketIO'; // Import socketService
import https from "https"
import fs from "fs"

const port = Number(process.env.PORT); // Convert port to a number

initApp().then(({app , server}) => {
  if(process.env.NODE_ENV !== "production"){
  initializeSocket(server); // This will initialize the Socket.io functionality
  server.listen(port, () => {
    console.log(`QueRico app listening at http://localhost:${port}`);
  });
}else{
  const prop = {
     key : fs.readFileSync("../client-key.pem"),
     cert : fs.readFileSync("../client-cert.pem")
  }
  const httpsServer = https.createServer(prop,app)
  initializeSocket(httpsServer)
  httpsServer.listen(port , '0.0.0.0',   () => {
    console.log(`QueRico app listening at https://localhost:${port}`);
  });
}
});