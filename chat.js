const net = require("net");
const readline = require("readline");
const os = require("os");

// Read user input cmds
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const connections = []; // Store all active connections

// Function to display a prompt for user input
function prompt() {
  rl.prompt();
}

// Function to send a message to a specific connection
function sendMessage(connection, message) {
  connection.write(message);
}

// Function to list all active connections
function listConnections() {
  connections.forEach((connection, index) => {
    const remoteAdd = connection.remoteAddress.replace("::ffff:", "");
    console.log(
      `${index + 1}: ${remoteAdd}:${connection.remotePort}`
    );
  });
}

// Function to terminate a connection
function terminateConnection(index) {
  if (index >= 0 && index < connections.length) {
    const connection = connections[index];
    connection.end();
    connections.splice(index, 1);
    console.log(
      `Connection terminated: ${connection.remoteAddress}:${connection.remotePort}`
    );
  } else {
    console.log("Invalid connection index.");
  }
}

const server = net.createServer((socket) => {
  const remoteAddress = socket.remoteAddress.replace("::ffff:", "");
  console.log(
    `New connection from ${remoteAddress}`
  );
  connections.push(socket);

  // Handle incoming data (messages) from this socket
  socket.on("data", (data) => {
    const message = data.toString();
    const remoteAddress = socket.remoteAddress.replace("::ffff:", "");
    const senderPort = socket.remotePort
    console.log(
      `Message received from ${remoteAddress}`
    );
    console.log(`Sender’s Port: ${senderPort}`);
    console.log(`Message: "${message}"`);
  });

  // Handle the remote peer closing the connection
  socket.on("end", () => {
    const remoteAddress = socket.remoteAddress.replace("::ffff:", "");
    console.log(
      `Connection closed by ${remoteAddress}:${socket.remotePort}`
    );
    const index = connections.indexOf(socket);
    if (index !== -1) {
      connections.splice(index, 1);
    }
  });

  // Handle errors on the socket
  socket.on("error", (err) => {
  });
});

server.listen(process.argv[2], () => {
  console.log(`Server listening on port ${process.argv[2]}`);
  prompt();
});

rl.on("line", (input) => {
  const parts = input.trim().split(" ");
  const command = parts[0];

  switch (command) {
    case "help":
      // Display help information
      console.log(`Available commands:
        help - Display this help message
        myip - Display the IP address of this process
        myport - Display the port on which this process is listening
        connect <destination> <port> - Connect to a remote peer
        list - List all active connections
        terminate <connection_id> - Terminate a connection
        send <connection_id> <message> - Send a message to a connection
        exit - Close all connections and terminate this process
      `);
      break;

    case "myip":
      // Display the IP address of this process
      const networkInterfaces = os.networkInterfaces();
      let ipAddress;

      // Loop through network interfaces to find a non-internal (i.e., external) IPv4 address
      for (const key in networkInterfaces) {
        const interfaceList = networkInterfaces['Wi-Fi'];
        for (const iface of interfaceList) {
          if (!iface.internal && iface.family === "IPv4") {
            ipAddress = iface.address;
            break;
          }
        }
        if (ipAddress) break;
      }

      if (ipAddress) {
        console.log("Your actual IP address: " + ipAddress);
      } else {
        console.log("Unable to determine your actual IP address.");
      }
      break;

    case "myport":
      // Display the port on which this process is listening
      console.log("Listening on port: " + server.address().port);
      break;

    case "connect":
      // Establish a new connection to a remote peer
      const destination = parts[1];
      const port = parseInt(parts[2], 10);

      // Check for duplicate connections
      const existingConnection = connections.find(
        (conn) =>
          conn.remoteAddress === destination &&
          conn.remotePort === port
      );

      if (existingConnection) {
        console.log(`Error: Already connected to ${destination}:${port}`);
      } else {
        

      const newSocket = net.connect(port, destination, () => {
        console.log(`Connected to ${destination}:${port}`);
        connections.push(newSocket);
      });

      newSocket.on("data", (data) => {
        const message = data.toString();
        const senderPort = newSocket.remotePort
        console.log(`Message received from ${destination}`);
        console.log(`Sender’s Port: ${senderPort}`);
        console.log(`Message: "${message}"`);
      });

      newSocket.on("end", () => {
        console.log(`Connection closed by ${destination}`);
        const index = connections.indexOf(newSocket);
        if (index !== -1) {
          connections.splice(index, 1);
        }
      });

      newSocket.on("error", (error) => {
        console.error(
          `Connection to ${destination}:${port} failed: ${error.message}`
        );
      });
    }
    break;

    case "list":
      // List all active connections
      listConnections();
      break;

    case "terminate":
      // Terminate a connection
      const indexToTerminate = parseInt(parts[1], 10) - 1;
      terminateConnection(indexToTerminate);
      break;

    case "send":
      // Send a message to a connection
      const connectionIndex = parseInt(parts[1], 10) - 1;
      const messageToSend = parts.slice(2).join(" ");
      sendMessage(connections[connectionIndex], messageToSend);
      break;

    case "exit":
      // Close all connections and terminate this process
      connections.forEach((connection) => {
        connection.end();
      });
      connections.length
      server.close(() => {
        console.log("Server closed.");
        process.exit(0);
      });
      break;

    default:
      console.log(
        'Invalid command. Type "help" for a list of available commands.'
      );
  }

  prompt();
});
