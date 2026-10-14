# Student Grade Management System

A beginner-friendly project using **HTML, CSS, JavaScript, and Java**. It is designed to open in VS Code and run with Java 17 or newer.

## Features
- Add student names, student IDs, and scores (0–100).
- View all students in a table.
- Search by name or student ID.
- Edit and delete student records.
- Calculate grades and class statistics (average, highest, lowest, pass count).
- Save records in the browser's **localStorage**, so they remain after closing/reopening the page in the same browser.
- Java backend calculates grades through a small HTTP API.
- Includes sample records on first launch.

## How arrays are used
- **JavaScript:** `let students = []` is an array of student objects. Adding, editing, searching, deleting, sorting, and calculating class statistics operate on this array.
- **Java:** `GRADE_MINIMUMS` and `GRADE_LABELS` are arrays. The grade calculator walks through these arrays to determine the grade for a score.
- Browser localStorage stores a serialized copy of the students array. When the page opens, it loads the saved JSON and reconstructs the array.

## Requirements
- Java Development Kit (JDK) 17 or newer.
- Visual Studio Code.
- Optional: Extension Pack for Java in VS Code.

No Maven, Gradle, database, or internet connection is required.

## Run in VS Code (Windows)
1. Extract `StudentGradeManager.zip`.
2. Open the extracted `StudentGradeManager` folder in VS Code (`File > Open Folder`).
3. Open the terminal in VS Code (`Terminal > New Terminal`).
4. Confirm Java is installed:
   ```powershell
   java -version
   javac -version
   ```
5. Compile the Java server:
   ```powershell
   javac -d out src\StudentGradeServer.java
   ```
6. Start the server:
   ```powershell
   java -cp out StudentGradeServer
   ```
7. Open this address in your browser:
   `http://localhost:8080`
8. Keep the terminal open while using the application. Press `Ctrl+C` in the terminal to stop the server.

## Run on macOS/Linux
From the project folder:
```bash
javac -d out src/StudentGradeServer.java
java -cp out StudentGradeServer
```
Then open `http://localhost:8080`.

## How to use the app
1. Add a student's name, ID, and score, then click **Add Student**.
2. Use the search field to find a student.
3. Click **Edit** to update a record or **Delete** to remove one.
4. The summary cards update automatically.
5. Click **Load Sample Data** if you want to restore the example records.
6. Records are saved in the browser's localStorage for this browser and origin. They are not synced to other devices or browsers.

## Grading scale used
- A: 80–100
- B: 70–79
- C: 60–69
- D: 50–59
- F: 0–49

This is an example grading scale for the project. Change the Java arrays in `src/StudentGradeServer.java` if your course uses a different scale.

## Troubleshooting
- **`javac` is not recognized:** Install a JDK (not just a JRE), then restart VS Code.
- **Port 8080 is already in use:** Close the other program using it, or change `PORT` in `src/StudentGradeServer.java` and update the URL.
- **The page cannot reach the Java API:** Ensure the Java server is still running and the page was opened through `http://localhost:8080`, not directly as a file.
- **Records are missing:** Make sure you are using the same browser and address (`localhost:8080`). Clearing browser site data removes localStorage.
