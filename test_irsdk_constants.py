import irsdk
print("irsdk.BroadcastMsg attributes:")
for attr in dir(irsdk.BroadcastMsg):
    print(f"{attr} = {getattr(irsdk.BroadcastMsg, attr)}")
