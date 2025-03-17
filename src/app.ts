import initApp from "./server";
import { initializeSocket } from '../src/services/socketIO'; // Import socketService

const port = process.env.PORT;

initApp().then(({app , server}) => {
  initializeSocket(server); // This will initialize the Socket.io functionality
  server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
});