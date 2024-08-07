const net = require('net');
const Buffer = require('buffer');

// Define the packet structure
const PACKET_CONTENTS = [
  { name: 'symbol', type: 'ascii', size: 4 },
  { name: 'buysellindicator', type: 'ascii', size: 1 },
  { name: 'quantity', type: 'int32', size: 4 },
  { name: 'price', type: 'int32', size: 4 },
  { name: 'packetSequence', type: 'int32', size: 4 }
];

const PACKET_SIZE = PACKET_CONTENTS.reduce((acc, curr) => acc + curr.size, 0);

// Create a function to create a payload to send
function createPayloadToSend(packet) {
  const buffer = Buffer.alloc(PACKET_SIZE);
  let offset = 0;
  PACKET_CONTENTS.forEach((field) => {
    if (field.type === 'ascii') {
      buffer.write(field.name, offset, field.size, 'ascii');
      offset += field.size;
    } else if (field.type === 'int32') {
      buffer.writeInt32BE(packet[field.name], offset);
      offset += field.size;
    }
  });
  return buffer;
}

// Create a server
const server = net.createServer((socket) => {
  console.log('Client connected');

  // Handle incoming data
  socket.on('data', (data) => {
    const callType = data.readInt8(0);
    if (callType === 1) {
      // Stream all packets
      packetData.packetStream.forEach((packet) => {
        const payload = createPayloadToSend(packet);
        socket.write(payload);
      });
      socket.end();
    } else if (callType === 2) {
      // Resend packet
      const resendSeq = data.readInt8(1);
      const packet = packetData.packetStream.find((packet) => packet.packetSequence === resendSeq);
      if (packet) {
        const payload = createPayloadToSend(packet);
        socket.write(payload);
      }
    }
  });

  // Handle disconnection
  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

// Start the server
server.listen(3000, () => {
  console.log('TCP server started on port 3000');
});

// Define some sample packet data
const packetData = {
  packetStream: [
    { symbol: 'MSFT', buysellindicator: 'B', quantity: 100, price: 200, packetSequence: 1 },
    { symbol: 'MSFT', buysellindicator: 'S', quantity: 50, price: 210, packetSequence: 2 },
    { symbol: 'AAPL', buysellindicator: 'B', quantity: 200, price: 150, packetSequence: 3 },
    // ...
  ]
};