## Features

Adds the ability to mark a file in a workspace as pinned to enable quickly setting e.g. a launch target in a debug configuration. So instead of having to create a new launch configuration for each test file, you can simply change the currently debugged file with a simple command. Compared to using e.g. `${file}`, this has the advantage that it still debugs the correct file if some other file is currently focused. (e.g. some internal code file that can't be run on its own)

## Requirements

This extension only works when a workspace/folder is opened.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

### 0.0.1
Initial release

---
