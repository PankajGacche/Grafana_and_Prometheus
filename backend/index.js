require('./tracing'); // Import tracing module for Jaeger integration

const express = require('express');
const cors = require('cors');
const promClient = require('prom-client'); // Prometheus client library
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;
const conn = require('./conn');
app.use(express.json());
app.use(cors());

const tripRoutes = require('./routes/trip.routes');

// Prometheus metrics collection
const register = new promClient.Registry(); // Create a new registry for custom metrics

// HTTP request duration metric (histogram)
const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'code'], // Labels for identifying metrics
    buckets: [50, 100, 200, 500, 1000], // Define buckets for response times
});

// Register the metrics with Prometheus registry
register.registerMetric(httpRequestDurationMicroseconds);

// Default Prometheus process metrics (like CPU, memory usage)
promClient.collectDefaultMetrics({ register });

// Middleware to collect request duration metrics for all routes
app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route?.path || req.url, code: res.statusCode });
    });
    next();
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Define routes
app.use('/trip', tripRoutes); // Example: http://localhost:3001/trip --> POST/GET/GET by ID

app.get('/hello', (req, res) => {
    res.send('Hello World!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});

