# Face Verification Enhancement

## Overview

The onboarding face verification has been enhanced with AI-powered face orientation detection and automatic image cropping.

## Features

### 1. **Face Orientation Detection**
- Uses face-api.js with TinyFaceDetector for real-time face landmark detection
- Validates that users are looking in the correct direction (front, left, or right)
- Calculates head pose using:
  - **Yaw**: Left/right rotation
  - **Pitch**: Up/down tilt
  - **Roll**: Side tilt

### 2. **Pose Validation**
Each capture requires specific head orientation:

- **Front Pose**: Face centered (yaw between -0.25 and 0.25)
- **Left Pose**: Head turned left (yaw between -0.7 and -0.2)
- **Right Pose**: Head turned right (yaw between 0.2 and 0.7)

All poses require:
- Minimal up/down tilt (pitch < 0.3)
- Minimal side tilt (roll < 0.3)

### 3. **Automatic Cropping**
- Captures are automatically cropped to a square
- Centered on the detected face
- 60% padding around face for context
- Saves storage and ensures consistent aspect ratio

## User Experience

### Visual Feedback
The circle overlay changes color based on detection status:
- 🔴 **Red**: No face detected
- 🟡 **Amber**: Face detected but wrong orientation
- 🟢 **Green**: Face detected with correct orientation

### Status Messages
- "Loading AI Models..." - Initial setup
- "No Face Detected" - Position face in circle
- "Adjust head position" - Face detected but wrong angle
- "Perfect! Hold still..." - Correct pose, countdown starting

### Auto-Capture
- 3-second countdown when correct pose is detected
- Visual countdown overlay
- Pulsing green circle animation
- Automatic progression to next pose

## Technical Implementation

### Dependencies
- `face-api.js@0.22.2` - Face detection and landmark analysis
- Models loaded from CDN: `@vladmandic/face-api@1.7.12`

### Files Modified
1. **src/lib/faceDetection.ts** - New utility for face detection
   - `loadFaceDetectionModels()` - Load AI models
   - `detectFaceOrientation()` - Detect face and calculate orientation
   - `validatePose()` - Check if orientation matches required pose
   - `cropToSquare()` - Crop image to square centered on face

2. **src/components/verification/FaceCapture.tsx** - Updated component
   - Real-time face detection loop
   - Pose validation logic
   - Automatic image cropping before upload
   - Enhanced UI feedback

### API Endpoint
No changes required to `src/app/api/upload/faces/route.ts` - it receives and saves the pre-cropped square images.

## Performance

- Detection runs every 100ms (10 fps)
- Uses TinyFaceDetector for optimal performance
- Models are loaded once and cached
- Total model size: ~1.5MB (loaded from CDN)

## Browser Compatibility

Requires modern browsers with:
- WebRTC/getUserMedia support
- Canvas API
- Modern JavaScript (ES6+)

Supported browsers:
- Chrome/Edge 60+
- Firefox 55+
- Safari 11+
- Opera 47+

## Future Enhancements

Potential improvements:
- Add liveness detection (blink detection, movement)
- Support for additional poses (profile views)
- Face quality scoring (blur detection, lighting)
- Age/emotion detection for analytics
- Multiple face handling
