# Kuawase User Manual

## 1. Software Overview

‘Kuawase’ is a presentation support application designed to streamline the operation of *ku-awase* (linked‐verse) matches.

- Load match data from Excel (.xlsx) files and easily assign matchups.  
- Configure background music (BGM).  
- Separate windows for spectator projection and administrator controls.

---

## 2. System Requirements

**Supported OS**  
- Windows 10 or later

**Required Software**  
- Microsoft Excel (or any application capable of creating .xlsx files)  
  *Google Sheets is also supported*

---

## 3. Installation

1. Download the latest installer (`.exe` file).  
2. Double-click the downloaded file and follow the on-screen instructions to complete installation.  
3. Launch ‘Kuawase’ by clicking the shortcut on your Desktop or Start Menu.

---

## 4. User Interface

‘Kuawase’ consists of two separate windows:

### ■ Administrator Window

- **Projection Panel (upper-left)**  
  - Displays match details (tournament name, red & white team names, theme, linked-verse)  
  - Updates in real time to mirror the Projection Window

- **Match Selection Panel (lower-left)**  
  - Choose red team, white team, theme, and match name

- **Control Panel (right-side)**  
  - Switch matches  
  - Recitation display (“Hikō”)  
  - Play/Pause BGM  
  - ▼ Timer  
  - ▶ Excel File Management  
  - ▶ BGM File Management  
  - ▶ Color Theme  

> Items marked with ▼ or ▶ can be expanded/collapsed by clicking their headers.  
> - ▼ panels are expanded by default.  
> - ▶ panels are collapsed by default.  
> - On the “Tournament Top” or “Match Top” screens, the “Recitation” control is hidden.

### ■ Projection Window

- Displays match details (tournament name, red & white team names, theme, linked-verse) for players and spectators.

---

## 5. Basic Operations

### 5.1 Loading Excel Data

- Download the Excel template from our GitHub repository and fill in match data according to the instructions.  
1. In the Administrator Window, open ▶ **Excel File Management** → **Select File**, then choose your `.xlsx` file.  
2. Once loaded, “Excel data loaded!” appears at the top of the window, and the contents refresh automatically.  
   > After refreshing, the file selector label resets to “No file selected.”

### 5.2 Selecting a Match

In the **Match Selection Panel**, choose:

- Red Team  
- White Team  
- Theme  
- Match Name  

Then click **Save**. “Saved!” appears at the top of the window, and the view refreshes.  
> You may use HTML tags in the Match Name field (e.g. `<br>` for line breaks).

### 5.3 In-Match Controls

1. Click buttons such as **Tournament Top**, **Match Top**, **Lead Contest**, … **Final Contest** to navigate stages.  
2. Click **Show Red** or **Show White** to reveal each team’s linked-verse.  
   > On **Tournament Top** and **Match Top**, the recitation controls are hidden.

### 5.4 Resetting Loaded Data

- In ▶ **Excel File Management**, click **Reset** to clear loaded Excel data, match selection, and BGM settings.  
  > Uploaded BGM files remain stored—delete them via ▶ **BGM File Management** → **Delete** next to each file.

### 5.5 Zooming In/Out

- **Ctrl** + `–` : Zoom out  
- **Ctrl** + **Shift** + `+` : Zoom in  
- **Ctrl** + `0` : Reset to default zoom

---

## 6. Timer Operations

- Expand with ▼ **Timer**.  
- Set the desired time for each timer, then click **Save**.  
- **Start** to begin countdown, **Pause** to pause, **Reset** to reset.  
- BGM plays automatically when a timer reaches zero.

**“1 minute left” / “Time’s up” alerts**  
- In the top timer, when 1:00 remains, “1 minute left” appears; at 0:00, “Time’s up” appears (shown only in the Administrator Window’s top timer).  

- To stop BGM, click **Reset** on the corresponding timer.  
- When the top timer hits 0:00, the bottom timer resets automatically even if it’s still running.  
- Collapse the timer by clicking ▼ **Timer** again; operation continues in the background.

---

## 7. Configuring BGM

1. Open ▶ **BGM File Management** → **Select File**, choose one or more audio files (mp3, wav, etc.), and click **Upload**.  
2. Uploaded files appear in the list with a **Delete** button. Deleting removes only the copy in Kuawase’s folder—not your original.  
3. Assign BGM to each scene, then click **Save BGM Settings** (“BGM settings saved!” appears).  
4. Uploaded files and settings persist after restart.

**Available Scenes**  
- Recitation  
- Entrance  
- Exit  
- Standby  
- Timer End (each timer can have its own BGM)

---

## 8. Customizing Color Themes

- Open ▶ **Color Theme** and choose from ~10 presets.  
- Changes apply immediately.

---

## 9. Updating the Software

- On startup, ‘Kuawase’ automatically checks for updates and installs the latest version if available.

---

## 10. Troubleshooting

- **Collapsed panels (▶) not visible**  
  → Click the header to expand.

- **Timer obstructs view**  
  → Click ▼ **Timer** to collapse; timer continues running.

- **Excel data not loading**  
  → “No file selected” is normal after load.  
  → Look for “Excel data loaded!” or correct tournament name display.  
  → If loading fails, retry or restart the application.

- **BGM won’t play**  
  → Confirm **Save BGM Settings** was clicked.  
  → Check system volume.

- **Projection window missing details**  
  → Verify Excel load and match save operations.

- **Match Selection Panel disabled**  
  → Load Excel data first.

---

## 11. Notes

- Thoroughly test match data and BGM files before events.

---

## 12. License & Copyright

‘Kuawase’ is released under an open-source license. See the included LICENSE file for details.

---

## 13. Support & Contact

- **GitHub**: [github.com/blackstraysheep/Kuawase](https://github.com/blackstraysheep/Kuawase)  
- Report issues or request features via GitHub Issues.

---

© 2025 BlackStraySheep  
All rights reserved.
