# Kuawase User Manual (v0.11.0)

## 1. Overview - For First-Time Users

### What is Kuawase?
**Kuawase** is a presentation application that supports the management of competitive poetry tournaments featuring haiku, tanka, and other short-form literary works.

### What can it do?
- Display matches between two teams (Red and White) in an audience-friendly format
- "Recitation" feature that displays each match's poems full-screen
- BGM playback and timer functions synchronized with the event progression
- Easy data import from Excel or Google Spreadsheets

### Basic Screen Configuration
The app consists of **two windows**:
1. **Administrator Window**: The operator's control screen (normal PC screen)
2. **Projector Window**: The audience display screen (projected via projector, etc.)

### Major Updates in v0.10.0
- **Enhanced build system** with improved dependency management
- **Resolved sanitize-html dependency issues** for better security
- **Updated electron-builder configuration** for more reliable packaging
- **Improved stability** and performance optimizations
- Continued support for Google Spreadsheet link loading and phrase data reset functionality

---

## 2. System Requirements
- OS: Windows 10 or later (Windows 11 recommended)
- Internet connection: Used for auto-updates and Google Spreadsheet loading
- Disk space: Approximately 200MB for installation
- Memory: 4GB RAM recommended for optimal performance

---

## 3. Installation / Updates
1. Download and run the latest installer (`.exe`).
2. **v0.5.x or later** users will receive **automatic updates** to v0.10.0 (restart required after update).
3. **Pre-v0.5.0** users should uninstall the old version first, then run the new installer.

### Initial Setup on First Launch
1. When you start the app, two windows will appear: **Administrator Window** and **Projector Window**
2. If connected to a projector or external monitor, move the **Projector Window** to that screen
3. Use the **Administrator Window** for operation on your PC screen

> **💡 Projector Connection Tip**  
> When using an external monitor with Windows, press `Windows Key + P` and select "Extend" mode to use your PC screen and projector screen separately.

---

## 4. Screen Layout

### 4.1 Administrator Window
The Administrator Window has a **projector screen preview** on the left and **control panels** on the right.

#### Basic Control Panel
- **Change Match (Stage Buttons)**
  - Compe TOP / Match TOP / Open. Bout / Sec. Bout / Mid. Bout / Penult. Bout / Fin. Bout
  - Clicking buttons instantly switches the projector display
- **Recitation Panel**
  - **Red Recitation** / **White Recitation** buttons
  - Only displayed during Open. Bout through Fin. Bout
  - Pressing buttons displays the corresponding team's poem full-screen on the projector
  - Automatically plays recitation BGM (if configured)

#### BGM & Audio Control
- **Play BGM Panel**
  - **Ent.**: Plays entrance BGM
  - **Exit**: Plays exit BGM
  - **Wait**: Plays waiting BGM
  - **Stop**: Stops currently playing BGM
  - **Wait Loop**: When checked, repeats waiting BGM continuously

#### Timer Functions
- **Two independent countdown timers**
  - **Upper Timer**: Configurable in minutes/seconds, individual **Save/Start/Pause/Reset** controls
  - **Lower Timer**: Configurable in seconds only, individual **Save/Start/Pause/Reset** controls
  - **Upper Timer** displays "1 min remaining" at 1:00 remaining and "Time's up" at 0:00 (Administrator screen only)
  - **Auto-plays BGM** when timer reaches 0 (if timer BGM is configured)

#### Match & Data Management
- **Match Setup Panel**
  - Specify Red Team / White Team / Theme / Match Name and save
  - **Match Name** supports HTML tags (e.g., `<br>`)
- **Phrase Data Management (Excel / Google Sheets)**
  - **Choose Excel File** → Load
  - **Load from Google Sheet** → Paste link and load
  - **Reset Phrase Data**: Initializes only phrase data (competition name, themes, poem list) while preserving BGM settings and files
- **BGM File Manager**
  - File upload, deletion (individual/bulk)
  - Scene-based assignment (Recitation/Entrance/Exit/Wait/Timer end, etc.)
  - **Save BGM Settings** to apply configurations
- **Display Settings/Others**
  - Theme color changes, language switching (日本語/English), reset all data, etc.

### 4.2 Projector Window
- **Initial Display**: Competition top page
  - Displays competition name only
- **Match TOP Page**:
  - Top: Competition name
  - Center-top: Match name (e.g., "Block A Match 1")
  - Center: Theme name
  - Bottom: "Match TOP" (English: "Match TOP")
  - Left/Right: Red and White team names
  - Far left/right: Small display of Red and White poems
- **Open. Bout through Fin. Bout**:
  - Basic layout same as Match TOP
  - Center-bottom displays each bout name ("Open. Bout", "Sec. Bout", etc.)
  - Pressing recitation buttons displays the corresponding team's poem full-screen
- **Language Switching**: Automatically switches Japanese/English labels
- Updates automatically in response to stage operations on the Administrator side

---

## 5. Data Preparation and Loading

### 5.1 Excel Template Key Points
- B1: Competition name
- D1: Number of teams
- F1: Number of themes
- H1 onward (every 2 columns): Theme names
- B3 downward: Team names
- Enter **poem data** for each team × theme in designated cells

> After loading, data is stored internally in the app's user data area.

### 5.2 Loading from Excel
1. Administrator screen → **Phrase Data Management** → **Choose Excel File** to specify `.xlsx`
2. Upon successful loading, reflects in screen header (verify via competition name and source display)
3. "Source:" on the right shows the loaded filename

### 5.3 Loading from Google Spreadsheets (v0.8.0+)
1. **Change sharing settings**:
   - Click the **Share** button (top right) in the spreadsheet
   - Change "General access" to "**Anyone with the link**"
   - Confirm permission is set to "**Viewer**"
2. **Loading procedure**:
   - Click "**Load from Google Sheet**" button on the Administrator screen
   - When modal opens, paste the "**Copy link**" URL into the input field
   - Click "**Load**" button
3. **Notes**:
   - Internally converted and parsed equivalent to `.xlsx`
   - Invalid links or insufficient access permissions will show error messages
   - Upon successful loading, reflects in screen header (verifiable via competition name)
   - "Source:" on the right shows the loaded URL

---

## 6. Basic Operation Procedure (First-Time Use)

### Step 1: Data Preparation and Loading
1. Prepare Excel template with tournament data or prepare Google Spreadsheet
2. Load Excel file or Google Spreadsheet from "Phrase Data Management" on Administrator screen
3. Verify successful loading by checking competition name display in screen header

### Step 2: Match Configuration
1. Configure the following in "Match Setup Panel" at bottom of Administrator screen:
   - Red Team and White Team (select from loaded data)
   - Theme
   - Match Name (e.g., "Block A<br>Match 1")
2. Click "Save" button to apply settings

### Step 3: Projector Screen Operation
1. Switch projector screen using "Change Match" buttons:
   - **Compe TOP**: Display competition name only
   - **Match TOP**: Display match information and poem overview
   - **Open. Bout through Fin. Bout**: Display detailed view of each match
2. "Red Recitation" and "White Recitation" buttons are available on Open. Bout through Fin. Bout screens
3. Recitation buttons display corresponding team's poem full-screen

### Step 4: BGM & Timer Utilization (Optional)
1. Upload BGM files and configure scene-based settings as needed
2. Use timers to manage event progression timing
3. Apply settings with "Save BGM Settings", then use various BGM buttons for audio effects

---

## 7. Display Control (Stage Switching and Recitation)
- Use **Stage buttons** to switch projector pages (Compe TOP/Match TOP/each bout)
- **Recitation function**:
  - **Red Recitation**/**White Recitation** buttons are only displayed during Open. Bout through Fin. Bout
  - Pressing buttons displays corresponding team's poem full-screen on projector
  - Automatically plays BGM during recitation (if configured)
- When Administrator screen is reloaded, projector returns to **competition top page**

---

## 8. BGM Management

### 8.1 Upload/Delete
- Select and upload audio files from **BGM File Manager**
- Files appear in **User BGM File List** with **Delete** (individual) and **Delete All** options available
- **Confirmation modal** appears before deletion to prevent accidental file removal
- Deletion affects **app's working copy** only; **original files remain unchanged**
- Supports common audio formats (MP3, WAV, M4A, etc.)

### 8.2 Scene-based Configuration and Playback
- Assign songs to **Recitation/Entrance/Exit/Wait/Timer end (per timer)**
- **Play BGM buttons**:
  - **Ent.**: Plays entrance BGM
  - **Exit**: Plays exit BGM
  - **Wait**: Plays waiting BGM
  - **Stop**: Stops currently playing BGM
- **Wait Loop** ON repeats waiting BGM continuously (checkbox reflects immediately even during playback)
- **Save BGM Settings** to apply configurations
- Only **one BGM plays at a time** (new playback overwrites current, including recitation)

---

## 9. Timers
- **Two independent** countdown timers
- **Upper Timer**: Configurable in minutes/seconds, individual **Save/Start/Pause/Reset** controls
- **Lower Timer**: Configurable in seconds only, individual **Save/Start/Pause/Reset** controls
- **Upper Timer special display**:
  - **1:00 remaining** shows "1 min remaining" on Administrator screen
  - **0:00 reached** shows "Time's up" on Administrator screen
- **Auto BGM playback**: Plays configured BGM when each timer reaches 0
- **Timer panel collapse**: ▼ button allows panel collapse (timer continues operating)

---

## 10. Language and Theme
- **Language Switching**:
  - Click "日本語" or "English" buttons in "Display Settings/Others" panel on Administrator screen
  - UI labels automatically switch based on locale
  - Examples: Compe TOP ↔ Compe TOP, Match TOP ↔ Match TOP,
    Open. Bout ↔ Open. Bout, Sec. Bout ↔ Sec. Bout,
    Mid. Bout ↔ Mid. Bout, Penult. Bout ↔ Penult. Bout, Fin. Bout ↔ Fin. Bout,
    Recitation ↔ Recitation (including Red/White)
- **Theme Color Change**:
  - Select from "Theme Color" dropdown menu in "Display Settings/Others" panel on Administrator screen
  - Selection immediately reflects in projector screen color scheme
- **Battle Design (CSS) Theme**:
  - Choose from multiple projector display themes: Standard, Dark, Washi (Japanese paper), Neo
  - Custom CSS files can be added via "Add Custom CSS" button
  - User-uploaded CSS files appear in the custom CSS list with individual delete options
- **Administrator Screen Dark Mode**:
  - Toggle dark mode for the administrator interface using the checkbox in "Display Settings/Others"
  - Does not affect projector screen appearance

---

## 11. Display & Operation Settings
- **Display Size Adjustment**:
  - `Ctrl` + `-` (zoom out/shrink) / `Ctrl` + `Shift` + `+` (zoom in/enlarge) / `Ctrl` + `0` (reset to 100%)
  - Keyboard shortcuts available for both Administrator and Projector windows individually
  - Click to activate each window before using shortcut keys
  - Useful for adjusting display size based on screen resolution or projector setup
  - Zoom settings are preserved between sessions
- **Panel Collapse**:
  - ▼ button at top-right of each panel (Timer, BGM File Manager, Phrase Data Management, etc.) allows panel collapse
  - Functions continue operating even when collapsed (e.g., timers continue running)
- **User Interface Feedback**:
  - **Toast notifications** appear at bottom of screen for successful operations (file loading, settings saved, etc.)
  - **Confirmation modals** prevent accidental deletions and data loss
  - **Error messages** provide specific guidance when operations fail

---

## 12. Save & Reset Types and Behavior
- **Match setup save**: Saving in Administrator screen's match setup panel immediately reflects in projector display and internal settings
- **Reset Phrase Data**: **Initializes only phrase data (competition name, themes, poem list)** (enhanced in v0.10.0)
  - BGM settings and uploaded BGM files are **preserved**
  - Executed via dedicated button in Phrase Data Management panel
- **Reset All Data**: Initializes all loaded Excel data, match setup, and **BGM settings**
  - Uploaded BGM files are also deleted
- **Individual BGM file deletion**: **Individual deletion** available from each row in BGM management (original files preserved)
- **Bulk BGM file deletion**: Bulk deletion of all BGM files available from BGM management panel

---

## 13. Frequently Asked Questions (FAQ)

### Q. App launched but nothing is loaded
**A.** No data is loaded on initial startup. Please proceed with the following steps:
1. Prepare Excel template or Google Spreadsheet
2. Load file from "Phrase Data Management" on Administrator screen
3. Configure match settings in "Match Setup Panel" and click "Save"

### Q. Projector screen not displaying correctly
**A.** Please check the following:
- Press Windows Key + P and select "Extend" mode
- Drag Projector window to projector screen
- Maximize or full-screen the Projector window

### Q. Recitation buttons not displayed
**A.** Recitation buttons are only displayed during Open. Bout through Fin. Bout. They do not appear on Match TOP or Compe TOP.

### Q. BGM not playing
**A.** Please check the following:
1. Are BGM files uploaded?
2. Are appropriate songs selected in scene-based settings?
3. Did you press "Save BGM Settings" button?
4. System volume settings

### Q. Timer display is in the way
**A.** You can collapse the panel using the ▼ button at the top-right of the Timer panel (operation continues)

### Q. Cannot load Excel/Google Sheets
**A.** Please check the following:
- For Google Sheets: Are sharing settings "Anyone with the link" and "Viewer"?
- For Excel: Is file format `.xlsx`?
- Is the file corrupted?
- Try restarting the app once and retry

---

## 14. Troubleshooting
- **Cannot load Excel/Google Sheets**
  - Recheck sharing settings (link sharing/viewer) and file format
  - Restart app and retry
- **Build/Installation Issues (v0.10.0 improvements)**
  - Fixed dependency resolution issues with sanitize-html package
  - Enhanced electron-builder configuration for more reliable packaging
  - If experiencing installation problems, try downloading the latest installer
- **Projector not updating**
  - Try switching stages again on Administrator side
- **Recitation buttons not displayed**
  - Recitation buttons are only displayed during Open. Bout through Fin. Bout
  - They do not appear on Match TOP or Compe TOP
- **BGM not playing**
  - Confirm "Save BGM Settings" was executed
  - Check system volume settings and supported file formats
- **Timer display in the way**
  - Use ▼ button to collapse Timer panel (operation continues)
- **Poems not displaying correctly**
  - Verify Excel template format is correct
  - Confirm Red/White teams and themes are correctly configured in Match Setup Panel

