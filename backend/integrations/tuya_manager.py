import tinytuya
import json
import os
from typing import List, Dict, Any

class TuyaManager:
    def __init__(self, storage_file="data/tuya_devices.json"):
        self.storage_file = storage_file
        self.credentials = self._load_credentials()
        self.devices = self._load_devices()
        self.cloud = None

    def get_credentials(self) -> Dict[str, str]:
        return self.credentials

    def _load_credentials(self) -> Dict[str, str]:
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    return data.get("credentials", {})
            except:
                return {}
        return {}

    def _load_devices(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    return data.get("devices", [])
            except:
                return []
        return []

    def _save_data(self):
        os.makedirs(os.path.dirname(self.storage_file), exist_ok=True)
        with open(self.storage_file, 'w') as f:
            json.dump({
                "credentials": self.credentials,
                "devices": self.devices
            }, f, indent=4)

    def connect_cloud(self, api_key: str, api_secret: str, region: str = "eu"):
        """Connect to Tuya Cloud to discover devices."""
        self.credentials = {
            "api_key": api_key,
            "api_secret": api_secret,
            "region": region
        }
        self.cloud = tinytuya.Cloud(
            apiRegion=region, 
            apiKey=api_key, 
            apiSecret=api_secret
        )
        self._save_data()
        return True

    def sync_devices(self) -> List[Dict[str, Any]]:
        """Fetch all devices from Tuya Cloud and update local storage."""
        if not self.cloud:
            if self.credentials:
                self.connect_cloud(
                    self.credentials["api_key"],
                    self.credentials["api_secret"],
                    self.credentials["region"]
                )
            else:
                raise Exception("No credentials provided")

        # Get list of devices from Cloud
        # Note: tinytuya.Cloud.getdevices() returns a list of devices
        cloud_devices = self.cloud.getdevices()
        
        processed_devices = []
        for d in cloud_devices:
            # Extract useful info
            device_info = {
                "name": d.get("name"),
                "id": d.get("id"),
                "key": d.get("key"), # Local Key for local control
                "category": d.get("category"), # e.g., 'dj' (light), 'cz' (socket)
                "product_name": d.get("product_name"),
                "online": d.get("online", False),
                "online": d.get("online", False),
                "wakeup_routine": False, # Deprecated
                "briefing_ids": [], # New: List of briefing IDs this device is linked to
                "wakeup_action": "ON"
            }
            
            # Preserve existing settings if device already exists
            existing = next((x for x in self.devices if x["id"] == device_info["id"]), None)
            if existing:
                device_info["wakeup_routine"] = existing.get("wakeup_routine", False)
                device_info["briefing_ids"] = existing.get("briefing_ids", [])
                device_info["wakeup_action"] = existing.get("wakeup_action", "ON")
            
            processed_devices.append(device_info)

        self.devices = processed_devices
        self._save_data()
        return self.devices

    def get_devices(self):
        return self.devices

    def update_device_settings(self, device_id: str, settings: Dict[str, Any]):
        """Update settings like briefing_ids for a specific device."""
        for d in self.devices:
            if d["id"] == device_id:
                d.update(settings)
                self._save_data()
                return d
        return None

    def send_command(self, device_id: str, command: str, value: Any = None):
        """Send a command to a device. Tries Local first, then Cloud."""
        device = next((d for d in self.devices if d["id"] == device_id), None)
        if not device:
            raise Exception("Device not found")

        # Determine device type for simple commands
        # This is a simplified logic, can be expanded based on category
        
        # Try Local Control if we have the key and IP (IP might need scanning, but tinytuya can handle some)
        # For simplicity in this v1, we might rely on Cloud if Local is complex to set up without IP scanning
        # But tinytuya.Device needs IP. 
        # Strategy: Use Cloud for reliability in v1 unless we implement a scanner.
        
        if not self.cloud:
             if self.credentials:
                self.connect_cloud(
                    self.credentials["api_key"],
                    self.credentials["api_secret"],
                    self.credentials["region"]
                )
        
        # Cloud Control
        commands = {}
        if command == "ON":
            commands = {"commands": [{"code": "switch_led", "value": True}]} # Example for some lights
            # Generic switch
            if device.get("category") in ["cz", "pc"]: # Socket/Power Strip
                 commands = {"commands": [{"code": "switch_1", "value": True}]}
            elif device.get("category") in ["dj", "xdd"]: # Light
                 commands = {"commands": [{"code": "switch_led", "value": True}]}
            
            # Fallback/Try standard codes if category logic is incomplete
            # Tuya Cloud API expects specific codes. 
            # For v1, we might send a generic "turn on" if the library supports it, 
            # or we iterate common codes.
            
            # Better approach with tinytuya Cloud: sendcommand
            # We need to know the specific function codes (switch_1, switch_led, etc.)
            # These are usually available in the device info 'functions' field if we fetched full details.
            pass

        # Simplified Cloud Command Wrapper
        # We will use the 'sendcommand' method which requires specific payload
        # For now, let's implement a toggle helper or specific known codes
        
        result = None
        
        # MAPPING COMMON COMMANDS
        # This is tricky without knowing exact device schema. 
        # But commonly: 'switch_1', 'switch_led', 'led_switch'
        
        if command == "ON":
             # Try common switch codes
             success = False
             for code in ["switch_1", "switch_led", "led_switch", "switch"]:
                 try:
                     result = self.cloud.sendcommand(device_id, {"commands": [{"code": code, "value": True}]})
                     if result.get("success"):
                         success = True
                         break
                 except:
                     continue
             return success

        elif command == "OFF":
             success = False
             for code in ["switch_1", "switch_led", "led_switch", "switch"]:
                 try:
                     result = self.cloud.sendcommand(device_id, {"commands": [{"code": code, "value": False}]})
                     if result.get("success"):
                         success = True
                         break
                 except:
                     continue
             return success
             
        return False

    def send_dps(self, device_id: str, dps: Dict[str, Any]):
        """Send specific DPS values (converted to commands) to a device."""
        commands = []
        for code, value in dps.items():
            commands.append({"code": code, "value": value})
        
        if self.cloud:
            try:
                self.cloud.sendcommand(device_id, {"commands": commands})
                return True
            except Exception as e:
                print(f"Error sending DPS to {device_id}: {e}")
                return False
        return False

    async def _progressive_wake(self, device_id: str, duration: int, target_val: int):
        """Augmente progressivement la luminosité ou ouvre les volets"""
        import asyncio
        print(f"DEBUG: Starting progressive wake for {device_id}. Duration: {duration}s, Target: {target_val}")
        
        # Find device to check category
        device = next((d for d in self.devices if d["id"] == device_id), None)
        category = device.get("category") if device else ""
        
        is_blind = category in ["cl", "kg"] # cl = curtain, kg = switch (sometimes used for blinds)
        
        try:
            if is_blind:
                # --- LOGIQUE VOLETS / STORES ---
                # Target val est 0-1000, on convertit en 0-100
                target_percent = int(target_val / 10)
                if target_percent > 100: target_percent = 100
                
                print(f"DEBUG: Blind detected. Target percent: {target_percent}%")
                
                # 1. S'assurer qu'il est fermé (ou à 0)
                # On ne ferme pas forcément pour ne pas plonger dans le noir si c'est déjà ouvert,
                # mais pour un réveil on suppose qu'on part de 0.
                # Pour être sûr, on peut envoyer 0 au début.
                self.send_dps(device_id, {"percent_control": 0})
                await asyncio.sleep(2)
                
                # 2. Progression
                steps = 10 # Moins d'étapes pour les moteurs (éviter de trop solliciter)
                step_duration = duration / steps
                step_val = target_percent / steps
                
                current_val = 0
                for i in range(steps):
                    current_val += step_val
                    val_int = int(current_val)
                    
                    # Certains moteurs n'aiment pas les petites incrémentations, 
                    # mais on tente le coup.
                    self.send_dps(device_id, {"percent_control": val_int})
                    await asyncio.sleep(step_duration)
                    
                # Final set
                self.send_dps(device_id, {"percent_control": target_percent})
                
            else:
                # --- LOGIQUE LUMIERES ---
                switch_code = "switch_led" # Default for lights
                if category in ["cz", "pc"]:
                    switch_code = "switch_1"
                elif category in ["dj", "xdd"]:
                    switch_code = "switch_led"
            
                # 1. Allumer la lampe au minimum (Envoi combiné propre)
                commands = [
                    {"code": "bright_value", "value": 10},
                    {"code": "bright_value_v2", "value": 10},
                    {"code": switch_code, "value": True}
                ]
                
                success = False
                if self.cloud:
                    try:
                        res = self.cloud.sendcommand(device_id, {"commands": commands})
                        if res.get("success"):
                            success = True
                        else:
                            print(f"WARN: Combined command failed: {res}")
                    except Exception as e:
                        print(f"WARN: Error sending combined command: {e}")

                # Fallback
                if not success:
                    print("DEBUG: Fallback to standard ON command")
                    self.send_command(device_id, "ON")
                    await asyncio.sleep(0.5)
                    self.send_dps(device_id, {"bright_value": 10, "bright_value_v2": 10})
                
                await asyncio.sleep(1)
                
                # 2. Calculer les étapes
                steps = 30 
                step_duration = duration / steps
                step_val = (target_val - 10) / steps
                
                current_val = 10
                for i in range(steps):
                    current_val += step_val
                    val_int = int(current_val)
                    
                    self.send_dps(device_id, {
                        "bright_value": val_int,
                        "bright_value_v2": val_int
                    })
                    await asyncio.sleep(step_duration)
                
            print(f"DEBUG: Progressive wake finished for {device_id}")
            
        except Exception as e:
            print(f"ERROR: Progressive wake failed for {device_id}: {e}")

    async def execute_wakeup_routine(self, briefing_id: str = None):
        import asyncio
        
        results = []
        progressive_tasks = []

        print(f"DEBUG: Executing wakeup routine. Briefing ID: {briefing_id}")

        for device in self.devices:
            should_trigger = False
            action_config = None
            
            if briefing_id:
                if briefing_id in device.get("briefing_ids", []):
                    should_trigger = True
                    actions = device.get("briefing_actions", {})
                    action_config = actions.get(briefing_id)
            else:
                if device.get("wakeup_routine"):
                    should_trigger = True

            if should_trigger:
                if not action_config:
                    action_config = {"type": "ON"}
                
                print(f"DEBUG: Triggering device {device['name']} ({device['id']}). Action: {action_config}")

                try:
                    if action_config.get("type") == "PROGRESSIVE":
                        duration = action_config.get("duration", 10) * 60 
                        target = action_config.get("target", 1000) 
                        
                        # Add to tasks list to run in parallel
                        progressive_tasks.append(self._progressive_wake(device["id"], duration, target))
                        results.append({"id": device["id"], "status": "started_progressive"})
                        
                    elif action_config.get("type") == "VALUE":
                        val = action_config.get("target", 1000)
                        self.send_dps(device["id"], {"bright_value": val, "switch_led": True})
                        results.append({"id": device["id"], "status": "success"})
                        
                    else:
                        self.send_command(device["id"], "ON")
                        results.append({"id": device["id"], "status": "success"})
                        
                except Exception as e:
                    print(f"ERROR: Failed to execute action for {device['name']}: {e}")
                    results.append({"id": device["id"], "status": "error", "message": str(e)})
        
        # Run all progressive tasks in parallel
        if progressive_tasks:
            print(f"DEBUG: Running {len(progressive_tasks)} progressive tasks in parallel")
            await asyncio.gather(*progressive_tasks)
            
        return results
