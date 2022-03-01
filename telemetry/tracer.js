'use strict';

const { HttpInstrumentation } = require ('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require ('@opentelemetry/instrumentation-express');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { NodeTracerProvider } = require("@opentelemetry/node");
const { SimpleSpanProcessor, ConsoleSpanExporter } = require ("@opentelemetry/tracing");
const { Resource } = require('@opentelemetry/resources');
const { GraphQLInstrumentation } = require ('@opentelemetry/instrumentation-graphql');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');

// Register server-related instrumentation
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new GraphQLInstrumentation()
  ]
});

// Initialize provider and identify this particular service
// (in this case, we're implementing a federated gateway)
const provider = new NodeTracerProvider({
  resource: Resource.default().merge(new Resource({
    "service.name": 'ekorre',
  })),
});

// Configure a test exporter to print all traces to the console
const traceExporter = new OTLPTraceExporter();
provider.addSpanProcessor(
  new SimpleSpanProcessor(traceExporter)
);

// Register the provider to begin tracing
provider.register();

