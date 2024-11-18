// tracing.js
const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const sdk = new opentelemetry.NodeSDK({
    traceExporter: new JaegerExporter({
        endpoint: 'http://localhost:14268/api/traces', // Jaeger collector endpoint
    }),
    instrumentations: [getNodeAutoInstrumentations()], // Automatically instruments popular libraries like Express
});

sdk.start()
    .then(() => {
        console.log('Tracing initialized');
    })
    .catch((error) => {
        console.log('Error initializing tracing', error);
    });

process.on('SIGTERM', () => {
    sdk.shutdown().then(() => {
        console.log('Tracing terminated');
    }).catch((error) => console.log('Error terminating tracing', error));
});
