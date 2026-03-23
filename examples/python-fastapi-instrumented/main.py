import asyncio
import random
from fastapi import FastAPI
from contextlib import asynccontextmanager

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# Set up tracing provider connected to Pulse OTel Collector (HTTP)
resource = Resource(attributes={SERVICE_NAME: "python-ml-service"})
provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4318/v1/traces"))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

app = FastAPI()

# Auto-instrument FastAPI routes
FastAPIInstrumentor.instrument_app(app)

tracer = trace.get_tracer(__name__)

@app.get("/predict")
async def get_prediction():
    # Example of manual span creation nested inside the route
    with tracer.start_as_current_span("Load Model Weights"):
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
    with tracer.start_as_current_span("Calculate Tensor"):
        await asyncio.sleep(random.uniform(0.3, 0.9))
        
    return {"status": "success", "confidence": random.uniform(0.8, 0.99)}

if __name__ == "__main__":
    import uvicorn
    print("Python API listening on port 8000. GET /predict to generate traces.")
    uvicorn.run(app, host="0.0.0.0", port=8000)
