let timerValue = 25 * 60;
let timerInterval;
let currentTask = null;

function fetchTasks() {
  fetch("/tasks")
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch tasks.");
      return response.json();
    })
    .then(tasks => {
      const taskList = document.getElementById("task-list");
      taskList.innerHTML = "";
      tasks.forEach(task => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${task.task} - Pomodoros: ${task.pomodoro}</span>
          <div class="task-buttons">
            <input type="checkbox" class="task-checkbox" onclick="completeTask('${task.task}')" />
            <button onclick="selectTask('${task.task}')">Select</button>
            <button onclick="startPomodoro('${task.task}')">Start Pomodoro</button>
          </div>
        `;
        taskList.appendChild(li);
      });
      scrollTaskContainerToBottom();
    })
    .catch(error => console.error("Error fetching tasks:", error));
}

function completeTask(taskName) {
  fetch(`/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: taskName }),
  }).then(() => fetchTasks());
}

function addTask() {
  const taskInput = document.getElementById("task-input");
  const task = taskInput.value.trim();

  if (task) {
    fetch("/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task: task }),
    }).then(() => {
      taskInput.value = "";
      fetchTasks();
    });
  }
}

function undo() {
  fetch("/undo", { method: "POST" })
    .then(() => fetchTasks())
    .catch(err => console.error(err));
}

function selectTask(task) {
  currentTask = task;
  document.getElementById("current-task").textContent = task;

  const taskList = document.getElementById("task-list").children;
  for (const taskItem of taskList) {
    taskItem.classList.remove("selected-task");
    if (taskItem.querySelector("span").textContent.startsWith(task)) {
      taskItem.classList.add("selected-task");
    }
  }
}

function startPomodoro(task) {
  if (currentTask !== task) {
    alert("Please select this task first!");
    return;
  }

  document.body.style.background = "linear-gradient(to right, #5efce8, #736efe)";

  if (!timerInterval) {
    timerInterval = setInterval(() => {
      if (timerValue > 0) {
        timerValue--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        alert(`Pomodoro session completed for "${currentTask}"!`);
        document.body.style.background =
          "linear-gradient(to right, #92EEAD, #92ED91, #48EE91, #48D0BC)";
        fetch("/pomodoro", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ task: currentTask }),
        }).then(() => fetchTasks());
        clearSelectedTask();
      }
    }, 1000);
  }
}

function clearSelectedTask() {
  const taskList = document.getElementById("task-list").children;
  for (const taskItem of taskList) {
    taskItem.classList.remove("selected-task");
  }
  currentTask = null;
  document.getElementById("current-task").textContent = "None";
}

function resetPomodoro() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerValue = 25 * 60;
  updateTimerDisplay();
  document.body.style.background =
    "linear-gradient(to right, #92EEAD, #92ED91, #48EE91, #48D0BC)";
  clearSelectedTask();
}

function increaseTimer() {
  timerValue += 60;
  updateTimerDisplay();
}

function decreaseTimer() {
  if (timerValue > 60) {
    timerValue -= 60;
    updateTimerDisplay();
  }
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerValue / 60);
  const seconds = timerValue % 60;
  document.getElementById("timer-display").textContent = `${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function scrollTaskContainerToBottom() {
  const taskContainer = document.querySelector(".task-list-container");
  taskContainer.scrollTop = taskContainer.scrollHeight;
}

fetchTasks();
updateTimerDisplay();
