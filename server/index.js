import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ping from 'ping';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Initialize LibSQL client
const db = createClient({
  url: 'file:local.db',
});

// Initialize Express app and Socket.io
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'TI', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      args: [username, hashedPassword],
    });

    // Converta `result.lastInsertRowid` para um número ou string
    const userId = Number(result.lastInsertRowid);

    const token = jwt.sign(
      { id: userId, username },
      process.env.JWT_SECRET || 'TI'
    );

    res.json({ id: userId, username, token });
  } catch (error) {
    res.status(400).json({ error: 'Nome já existe' });
    console.log('Erro no registro:', error);
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE username = ?',
    args: [username]
  });
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username },
    process.env.JWT_SECRET || 'TI'
  );
  res.json({ id: user.id, username, token });
});

// Device routes
app.get('/api/devices', authenticateToken, async (req, res) => {
  const result = await db.execute('SELECT * FROM devices');
  res.json(result.rows);
});

/* app.post('/api/devices/:id/ping', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const result = await db.execute({
    sql: 'SELECT * FROM devices WHERE id = ?',
    args: [id]
  });
  const device = result.rows[0];

  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  try {
    const pingResult = await ping.promise.probe(device.ip);
    const status = pingResult.alive ? 1 : 0;

    await db.execute({
      sql: 'UPDATE devices SET status = ? WHERE id = ?',
      args: [status, id]
    });
    
    const updatedResult = await db.execute({
      sql: 'SELECT * FROM devices WHERE id = ?',
      args: [id]
    });
    const updatedDevice = updatedResult.rows[0];
    
    io.emit('deviceStatusUpdate', { id, status });
    res.json(updatedDevice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to ping device' });
  }
});
 */
app.get('/api/routers', authenticateToken, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT r.*, d.ip, d.name, d.status  
      FROM Routers r
      JOIN Devices d ON r.device_id = d.id
    `);

    // Retorne o resultado como JSON
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// Printer routes
app.get('/api/printers', authenticateToken, async (req, res) => {
  const result = await db.execute(`
      SELECT p.*, d.ip, d.sector, d.status, p.model, p.npat, p.li, p.lf, p.online
      FROM printers p
      JOIN Devices d ON p.device_id = d.id
  `);
  res.json(result.rows);
});

app.post('/api/printers/:id/online', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { online } = req.body;

  // Validação do status
  if (![1, 0].includes(online)) {
    return res.status(400).json({ error: 'Invalid online status. Must be 1 or 0.' });
  }

  try {
    // Atualiza o status na tabela devices
    const updateResult = await db.execute({
      sql: 'UPDATE printers SET online = ? WHERE id = ?',
      args: [online, id]
    });

    // Verifica se alguma linha foi afetada
    if (updateResult.rowsAffected === 0) {
      return res.status(404).json({ error: 'Printer not found or no change made.' });
    }

    // Retorna uma resposta de sucesso
    res.status(200).json({ message: 'Printer online status updated successfully' });
  } catch (error) {
    console.error('Error updating printer online status:', error);
    res.status(500).json({ error: 'Failed to update printer online status.' });
  }
});


// Box routes
app.get('/api/boxes', authenticateToken, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT b.*, d.ip, d.name, d.status, b.power_status
      FROM boxes b
      JOIN Devices d ON b.device_id = d.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching boxes:', error);
    res.status(500).json({ error: 'Failed to fetch boxes' });
  }
});

app.post('/api/boxes/:id/power-status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { power_status } = req.body;

  // Valida o power_status
  if (![1, 0].includes(power_status)) {
    return res.status(400).json({ error: 'Invalid power status. Must be 1 or 0.' });
  }

  try {
    // Atualiza a coluna power_status na tabela boxes
    const updateResult = await db.execute({
      sql: 'UPDATE boxes SET power_status = ? WHERE device_id = ?',
      args: [power_status, id],
    });

    // Verifica se alguma linha foi afetada
    if (updateResult.rowsAffected === 0) {
      return res.status(404).json({ error: 'Box not found or no change made.' });
    }

    // Busca os dados atualizados
    const result = await db.execute({
      sql: `
        SELECT r.*, d.ip, d.name, d.status, r.power_status
        FROM boxes r
        JOIN Devices d ON r.device_id = d.id
        WHERE r.device_id = ?
      `,
      args: [id],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Box not found after update.' });
    }

    // Retorna os dados atualizados
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating box power status:', error);
    res.status(500).json({ error: 'Failed to update box power status.' });
  }
});

// Automatic ping service
const pingAllDevices = async () => {
  const result = await db.execute('SELECT * FROM devices');
  const devices = result.rows;
  
  for (const device of devices) {
    try {
      const pingResult = await ping.promise.probe(device.ip);
      const status = pingResult.alive ? 1 : 0;
      if (status !== device.status) {
        await db.execute({
          sql: 'UPDATE devices SET status = ? WHERE id = ?',
          args: [status, device.id]
        });
        io.emit('deviceStatusUpdate', { id: device.id, status });
      }
    } catch (error) {
      console.error(`Failed to ping device ${device.id}:`, error);
    }
  }
};

// Run ping service every 30 seconds
setInterval(pingAllDevices, 30000);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();