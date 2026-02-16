# GridPass Client

Universal device agent for GridPass OS - handles sim racing, real car telemetry, file sync, and remote control.

## Features

- **Modular Architecture** - Enable/disable features as needed
- **Sim Racing Module** - iRacing integration (ACC, rFactor 2 coming soon)
- **Real Telemetry** - Real car data logging (future)
- **File Sync** - P2P file sharing at track (future)
- **Remote Control** - Execute commands from web dashboard

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure

Edit `config.py` and add your GridPass credentials:

```python
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_ANON_KEY = "your-anon-key"
```

Or copy `.env.example` to `.env` and fill in values (support coming soon).

### 3. Test Setup

Before running, verify everything is configured:

```bash
python test_setup.py
```

This will check:
- ✅ All dependencies installed
- ✅ Configuration is valid  
- ✅ Device info can be gathered
- ✅ API is reachable

### 4. Run

```bash
python main.py
```

## Module Configuration

Enable/disable modules in `config.py`:

```python
MODULES_ENABLED = {
    "sim_racing": True,      # iRacing, ACC, etc.
    "real_telemetry": False, # Real car data
    "file_sync": False,      # P2P file sharing
}
```

## Architecture

```
client/
├── main.py              # Main entry point
├── config.py            # Configuration
├── device_manager.py    # Device registration & heartbeat
└── modules/
    └── sim_racing/      # Sim racing module
        ├── module.py
        ├── config.py
        └── command_executor.py
```

## How It Works

1. **Register** - Client registers this PC with GridPass
2. **Heartbeat** - Sends status every 5 seconds
3. **Poll Commands** - Checks for remote commands
4. **Execute** - Routes commands to appropriate module
5. **Report** - Sends results back to GridPass

## Remote Commands

Via web dashboard at `https://gridpass.app/devices`:

- Reset Car
- Enter/Exit Car  
- Ignition On/Off
- Pit Limiter
- Custom commands (coming soon)
