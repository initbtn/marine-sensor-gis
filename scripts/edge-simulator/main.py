import time
import math
import random
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Marine Edge Sensor Simulator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ControlCommand(BaseModel):
    command: str  # "BYPASS_TOGGLE", "BACKWASH_TRIGGER", "SATELLITE_TOGGLE"
    value: Optional[bool] = None

class EdgeState:
    vessel_id: str = "IMO9186467"
    emergency_bypass: bool = False
    backwash_active: bool = False
    satellite_online: bool = True
    step: int = 0

state = EdgeState()

def generate_telemetry():
    state.step += 1
    t = state.step * 0.1  # 10Hz time step
    
    # Scrubber physics model (IMO MEPC.340(77))
    if state.emergency_bypass:
        scrubber_dp = 0.1
        scrubber_ph = 8.1
        scrubber_turbidity = 0.8
        so2_co2 = 18.5  # Bypassed exhaust (high SO2/CO2)
    else:
        # Base sinusoidal fluctuation with random sensor noise
        scrubber_dp = round(1.4 + 0.15 * math.sin(t * 0.05) + random.uniform(-0.02, 0.02), 2)
        scrubber_ph = round(7.2 + 0.2 * math.cos(t * 0.04) + random.uniform(-0.05, 0.05), 2)
        scrubber_turbidity = round(2.5 + 0.4 * math.sin(t * 0.08) + random.uniform(-0.1, 0.1), 2)
        so2_co2 = round(3.8 + 0.2 * math.sin(t * 0.03) + random.uniform(-0.05, 0.05), 2)

    # BWTS physics model (BWM D-2)
    if state.backwash_active:
        filter_dp = round(0.15 + random.uniform(-0.02, 0.02), 2)
    else:
        # Gradually build differential pressure until backwash
        filter_dp = round(0.35 + 0.1 * math.sin(t * 0.02) + random.uniform(-0.01, 0.01), 2)

    uv_intensity = round(96.0 + 2.0 * math.cos(t * 0.02) + random.uniform(-0.5, 0.5), 1)
    tro = round(1.9 + 0.2 * math.sin(t * 0.03) + random.uniform(-0.05, 0.05), 2)

    return {
        "vessel_id": state.vessel_id,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "scrubber_dp": scrubber_dp,
        "scrubber_ph": scrubber_ph,
        "scrubber_turbidity": scrubber_turbidity,
        "scrubber_so2_co2_ratio": so2_co2,
        "bwts_filter_dp": filter_dp,
        "bwts_uv_intensity": uv_intensity,
        "bwts_tro": tro,
        "controls": {
            "emergency_bypass": state.emergency_bypass,
            "backwash_active": state.backwash_active,
            "satellite_online": state.satellite_online,
        },
    }

@app.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": "marine-edge-daemon",
        "vessel_id": state.vessel_id,
        "satellite_online": state.satellite_online,
        "controls": {
            "emergency_bypass": state.emergency_bypass,
            "backwash_active": state.backwash_active,
        },
    }

@app.get("/telemetry/latest")
def get_latest_telemetry():
    return generate_telemetry()

@app.post("/command")
def execute_command(cmd: ControlCommand):
    command_name = cmd.command.upper()
    
    if command_name == "BYPASS_TOGGLE":
        state.emergency_bypass = cmd.value if cmd.value is not None else not state.emergency_bypass
        return {"status": "success", "emergency_bypass": state.emergency_bypass}
    
    elif command_name == "BACKWASH_TRIGGER":
        state.backwash_active = cmd.value if cmd.value is not None else not state.backwash_active
        return {"status": "success", "backwash_active": state.backwash_active}
    
    elif command_name == "SATELLITE_TOGGLE":
        state.satellite_online = cmd.value if cmd.value is not None else not state.satellite_online
        return {"status": "success", "satellite_online": state.satellite_online}
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown command: {cmd.command}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
