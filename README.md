
# 🚀 Robust HabitFlow Backend Script

Copy and paste this script into your Google Apps Script editor (**Extensions** > **Apps Script**) to support adding, editing, and deleting habits.

```javascript
function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  
  // 1. GET ALL HABITS
  if (action === 'getHabits') {
    var habits = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      habits.push({
        id: data[i][0].toString(),
        name: data[i][1],
        category: data[i][2],
        completed: data[i][3] === true || data[i][3] === "TRUE"
      });
    }
    return createJsonResponse(habits);
  }
  
  // 2. TOGGLE STATUS
  if (action === 'updateHabit') {
    var id = e.parameter.id;
    var completed = e.parameter.completed === 'true';
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === id) {
        sheet.getRange(i + 1, 4).setValue(completed);
        return createJsonResponse({success: true});
      }
    }
  }

  // 3. ADD NEW HABIT
  if (action === 'addHabit') {
    sheet.appendRow([
      e.parameter.id,
      e.parameter.name,
      e.parameter.category,
      false // New habits start uncompleted
    ]);
    return createJsonResponse({success: true});
  }

  // 4. EDIT HABIT
  if (action === 'editHabit') {
    var id = e.parameter.id;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === id) {
        sheet.getRange(i + 1, 2).setValue(e.parameter.name);
        sheet.getRange(i + 1, 3).setValue(e.parameter.category);
        return createJsonResponse({success: true});
      }
    }
  }

  // 5. DELETE HABIT
  if (action === 'deleteHabit') {
    var id = e.parameter.id;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === id) {
        sheet.deleteRow(i + 1);
        return createJsonResponse({success: true});
      }
    }
  }

  return createJsonResponse({error: "Action not recognized"});
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### ⚠️ Important Deployment Note
Every time you update the code in Apps Script, you must click **Deploy** > **Manage Deployments** > **Edit** (pencil icon) > **New Version** > **Deploy** to ensure the URL points to the latest logic.
