# Video Demonstration Script - Anonymous Membership System with FHEVM

**Duration**: 60 seconds
**Format**: Screen recording with voiceover
**Resolution**: 1080p or higher
**Audio**: Clear, professional narration

---

## Production Notes

This script provides a complete 60-second demonstration of the Anonymous Membership System FHEVM project. Follow the timing cues for each segment. The narration has been separated into a dedicated file (VIDEO_NARRATION) for easy reading and editing.

---

## Video Segments

### Segment 1: Project Overview (0-10 seconds)

**Visual**:
- Show project repository folder structure
- Display GitHub/file explorer with main README.md visible
- Zoom in on README title: "Anonymous Membership System with FHEVM"

**Action**:
- Open terminal in project root
- Type: `ls -la`
- Show directory listing with contracts/, test/, docs/, scripts/

---

### Segment 2: Installation & Compilation (10-25 seconds)

**Visual**:
- Terminal showing npm install progress
- Display package.json dependencies being installed

**Actions**:
1. Run: `npm install`
   - Show packages installing
   - Wait for completion (can speed up video)

2. Run: `npm run compile`
   - Show compilation progress
   - Display "Successfully compiled X contracts"
   - Show artifacts directory being created

**Timing**: 15 seconds total for installation and compilation

---

### Segment 3: Test Execution (25-40 seconds)

**Visual**:
- Terminal showing test execution
- Test output with passing tests highlighted

**Actions**:
1. Run: `npm run test`
   - Show tests executing
   - Highlight successful test results
   - Display summary: "X passing"
   - Show test coverage statistics

**Highlight**:
- Display test counts: "SimpleMembership (15 tests)"
- Show "FHEArithmetic (12 tests)"
- Mention "Total: 104+ tests passing"

**Timing**: 15 seconds for test execution and results

---

### Segment 4: Example Generation (40-50 seconds)

**Visual**:
- Terminal showing automation script execution
- Files being generated in real-time

**Actions**:
1. Run: `npm run create-example basic-member ./output/basic-member`
   - Show script creating directory structure
   - Display files being generated:
     - contracts/SimpleMembership.sol
     - test/SimpleMembership.ts
     - hardhat.config.ts
     - package.json

2. Show generated project structure:
   ```
   output/basic-member/
   ├── contracts/
   ├── test/
   ├── hardhat.config.ts
   └── package.json
   ```

**Timing**: 10 seconds for example generation

---

### Segment 5: Key Features Summary (50-60 seconds)

**Visual**:
- Display key metrics on screen
- Fade in text overlays
- Show contract examples

**Display Text**:
```
Anonymous Membership System with FHEVM

✓ 12 Production-Ready Smart Contracts
✓ 8 Comprehensive Test Suites (104+ tests)
✓ 3 Automation Scripts
✓ Complete Documentation
✓ Ready for Production

Key Patterns:
- Encrypted State Management
- FHE Arithmetic Operations
- Privacy-Preserving Comparisons
- Access Control
- Advanced Auctions & Tokens
```

**Visual Actions**:
1. Show SimpleMembership.sol code snippet (2 seconds)
2. Show test output snippet (2 seconds)
3. Display FAQ.md and troubleshooting.md (2 seconds)
4. End with project repository URL and "Thank you" slide (2 seconds)

**Timing**: 10 seconds for final summary

---

## Technical Requirements

### Software Setup
- Terminal: Bash/Zsh with clear font (Monaco 14pt or similar)
- IDE/Editor: VS Code with Dark Mode (recommended)
- Screen: Entire desktop visible
- Audio: Quiet room, USB microphone recommended

### Recording Tips

1. **Before Recording**:
   - Clear desktop of unnecessary windows
   - Increase font size in terminal (14-16pt)
   - Have all commands pre-tested
   - Close Slack, notifications, etc.

2. **During Recording**:
   - Speak clearly and naturally
   - Type commands at readable speed
   - Pause after each action to show results
   - Use arrow keys to show code examples

3. **Post-Production**:
   - Edit pauses (remove waiting time during npm install)
   - Add smooth transitions between segments
   - Use speed-up for file downloads/compilation (2x-4x)
   - Add text overlays for key metrics
   - Include background music (optional, low volume)
   - Final audio mixing and normalization

### Software Recommendations
- Recording: OBS Studio (free) or ScreenFlow (Mac)
- Editing: DaVinci Resolve (free) or Adobe Premiere
- Audio: Audacity (free) or Logic Pro

---

## Narration

See [VIDEO_NARRATION](./VIDEO_NARRATION) for the complete 60-second script without timing information.

---

## Quality Checklist

Before submitting the video, verify:

- [ ] Audio is clear and audible
- [ ] Video resolution is 1080p minimum
- [ ] All text is readable (16pt+ font)
- [ ] Timing matches script (approximately 60 seconds)
- [ ] Commands execute successfully and show results
- [ ] No personal information visible in terminal
- [ ] No error messages shown
- [ ] Transitions are smooth between segments
- [ ] Terminal commands are visible and legible
- [ ] Final summary/call-to-action is clear

---

## Upload Instructions

1. Export video as MP4 (H.264 codec, 30fps)
2. Upload to YouTube with title: "Anonymous Membership System with FHEVM - Zama Bounty Submission"
3. Description: Include link to repository and this README
4. Update README.md with video URL
5. Submit video URL to Zama Guild platform

---

**Total Video Duration**: 60 seconds
**Target Completion**: Before December 31, 2025
**Required**: Clear demonstration of project features
