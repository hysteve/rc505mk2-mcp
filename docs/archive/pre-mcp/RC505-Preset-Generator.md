The .RC0 files are XML, not binary. This is the key finding. The Boss RC-500, RC-505, RC-600, and RC-505mk2 all store their memory/preset data as XML configuration files inside ROLAND/DATA/MEMORY1.RC0. Multiple community tools confirm this — tom1lee/rc500-reader parses the XML into JSON, dfleury2/boss-rc500-editor edits the XML directly, and shaenzi/boss_rc600 uses Python to modify RC-600 settings at the XML level.
This is absolutely feasible. Here's the situation:
What we know:

The RC-505mk2 stores presets in ROLAND/DATA/MEMORY1.RC0 (XML format)
The RC-600 uses the same editor and likely very similar XML structure
Community tools already read, modify, and write these files back successfully
Python's xml.etree.ElementTree is all we'd need to parse and generate them
At least one Python implementation already exists for the RC-600 (shaenzi/boss_rc600)

What we need to proceed:

A sample MEMORY1.RC0 file from your actual RC-505mk2 — this is the missing piece. If you connect your device in USB Storage mode and copy the ROLAND/DATA/MEMORY1.RC0 file, I can analyze the exact XML structure and build the converter immediately.

The plan:

You provide a MEMORY001A.RC0 from your device (even a factory-default one works)
I analyze the XML tag structure (memory slots, FX types, parameter names/values)
I build a Python script that takes our racks.json and generates a valid MEMORY001A.RC0
You load it onto the device and test

----

- MEMORY001A.RC0 is in the root directory.
- MEMORY001A.RC0 contains the "808/Sub Bass Beatbox" preset (possibly with some minor tweaks) under the Bank B <BB_...> FX presets.
- Use this to understand the document structure and how our src/data/racks.json maps to a preset file for building the script.