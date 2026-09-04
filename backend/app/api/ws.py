from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

import json

@router.websocket("/ws/map")
async def map_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Handle incoming messages (e.g. from drivers)
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get('type') in ['DRIVER_LOCATION', 'SOS_ALERT', 'NEW_INCIDENT']:
                    # Broadcast the driver location and alerts to everyone (including admins)
                    await manager.broadcast(msg)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
