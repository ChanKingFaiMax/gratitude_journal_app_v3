#!/bin/bash
# Start Metro bundler using sandbox proxy URL (no tunnel needed)
#
# The sandbox injects REACT_NATIVE_PACKAGER_HOSTNAME and EXPO_PACKAGER_PROXY_URL
# which allow Expo Go on physical devices to connect via the public proxy URL.
# No ngrok tunnel is needed — the sandbox proxy handles external access.
exec npx expo start --web --port ${EXPO_PORT:-8081}
