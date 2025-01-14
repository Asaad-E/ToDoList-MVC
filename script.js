"use-strict";

// --------------- Elements ---------------

const inputTodo = document.querySelector(".todo-list__input");
const todoContainer = document.querySelector(".todo-list__list-container");

const labelItemsLeft = document.querySelector(".todo-list__left-count");
const optionsBtns = document.querySelector(".todo-list__filters");
const clearBtn = document.querySelector(".todo-list__clear");

let activeFilter = document.querySelector(".todo-list__filters-all");

// --------------- Model ---------------

class TodoModel {
  dbName = "todo";

  constructor() {
    this.lastIndex;
    this.tasks;

    this.loadData();
  }

  saveData() {
    try {
      localStorage.setItem(this.dbName, JSON.stringify(this.tasks));
      localStorage.setItem(
        this.dbName + "-lastIndex",
        JSON.stringify(this.lastIndex)
      );
    } catch (e) {
      console.error("Error saving data to local storage");
    }
  }

  loadData() {
    let data;
    let lastIndex;
    try {
      data = localStorage.getItem(this.dbName);
      lastIndex = localStorage.getItem(this.dbName + "-lastIndex");

      if (data) {
        data = JSON.parse(data);
      } else {
        data = [];
      }

      if (lastIndex) {
        lastIndex = Number(lastIndex);
      } else {
        lastIndex = -1;
      }
    } catch (e) {
      console.error("Error to sava data to local storage");
    }

    this.tasks = data || [];
    this.lastIndex = lastIndex || -1;
  }

  clearDataBase() {
    this.tasks = [];
    this.lastIndex = -1;
    this.saveData();
  }

  addTask(text) {
    this.tasks.push({
      index: this.lastIndex + 1,
      order: this.lastIndex + 1,
      text,
      completed: false,
    });

    this.lastIndex++;

    this.saveData();

    return this.tasks.at(-1);
  }

  getTask(index) {
    return this.tasks.find((task) => task.index === index);
  }

  getTasks() {
    return this.tasks;
  }

  getTasksOrdered() {
    return this.tasks.sort((t1, t2) => t1.order - t2.order);
  }

  getAllActive() {
    return this.getTasksOrdered().filter((task) => task.completed === false);
  }

  getAllCompleted() {
    return this.getTasksOrdered().filter((task) => task.completed === true);
  }

  removeTask(index) {
    const pos = this.tasks.findIndex((task) => task.index === index);

    this.tasks.splice(pos, 1);

    this.saveData();
  }

  toggleCompleted(index) {
    this.getTask(index).completed = !this.getTask(index).completed;
    this.saveData();
  }
}

const model = new TodoModel();

// --------------- Functions (View) ---------------

function sanitizeInput(text) {
  return (
    text
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove script tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove javascript: protocol handlers
      .replace(/javascript:/gi, "")
      // Remove event handlers
      .replace(/on\w+=/gi, "")
      // Keep only letters, numbers, spaces and basic punctuation
      .replace(/[^\w\s.,!?-]/gi, "")
      // Limit length to 100 characters
      .slice(0, 100)
  );
}

function addTaskUI(task) {
  const taskElement = `
    <div class="todo-list__todo ${
      task.completed ? "todo-list__todo--completed" : ""
    }" id="${task.index}" draggable="true">
        <span class="todo-list__todo__check"></span>
        <span class="todo-list__todo__text">${task.text}</span>
        <span class="todo-list__todo__delete">&times;</span>
    </div>
    `;

  todoContainer.insertAdjacentHTML("beforeend", taskElement);

  document.getElementById(task.index).addEventListener("dragstart", (event) => {
    console.log(`Now dragged element index = ${task.index}`);
    event.dataTransfer.setData("text/plain", task.index);
  });
}

function updateItemsLeft() {
  const count = model.getAllActive().length;
  labelItemsLeft.textContent = count;

  if (count === 0) {
    labelItemsLeft.parentElement.classList.add("all-completed");
  } else {
    labelItemsLeft.parentElement.classList.remove("all-completed");
  }
}

function showCompleted() {
  todoContainer.innerHTML = "";
  model.getAllCompleted().forEach(addTaskUI);
}

function showActive() {
  todoContainer.innerHTML = "";
  model.getAllActive().forEach(addTaskUI);
}

function showAll() {
  todoContainer.innerHTML = "";
  model.getTasksOrdered().forEach(addTaskUI);
}

// --------------- Event listener (Controller) ---------------

inputTodo.addEventListener("keyup", (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();

  const text = sanitizeInput(inputTodo.value);

  if (text !== "") {
    const newTask = model.addTask(text);
    addTaskUI(newTask);
    updateItemsLeft(model.getTasks());
  }

  inputTodo.value = "";
});

todoContainer.addEventListener("click", (e) => {
  const target = e.target;
  const index = Number(target.parentElement.id);

  // Check logic
  if (target.classList.contains("todo-list__todo__check")) {
    model.toggleCompleted(index);
    target.parentElement.classList.toggle("todo-list__todo--completed");

    updateItemsLeft(model.getTasks());
  }
  // Delete logic
  else if (target.classList.contains("todo-list__todo__delete")) {
    target.parentElement.parentElement.removeChild(target.parentElement);
    model.removeTask(index);

    updateItemsLeft(model.getTasks());
  }
});

clearBtn.addEventListener("click", (e) => {
  e.preventDefault();

  model.getAllCompleted().forEach((task) => {
    model.removeTask(task.index);
    todoContainer.removeChild(document.getElementById(task.index));
  });
});

optionsBtns.addEventListener("click", (e) => {
  e.preventDefau;
  lt();

  const target = e.target.classList;

  if (!target.contains("todo-list__filters")) {
    // change the active filter
    activeFilter.classList.toggle("active");
    activeFilter = e.target;
    activeFilter.classList.toggle("active");

    todoContainer.innerHTML = "";

    //apply filter
    if (target.contains("todo-list__filters-all")) {
      showAll();
    } else if (target.contains("todo-list__filters-active")) {
      showActive();
    } else if (target.contains("todo-list__filters-completed")) {
      showCompleted();
    }
  }
});

// --------------- Drag and drop (Controller) ---------------

todoContainer.addEventListener("dragover", (event) => {
  event.preventDefault();
});

todoContainer.addEventListener("drop", (event) => {
  event.preventDefault();

  // Dragged Element
  const draggedIndex = Number(event.dataTransfer.getData("text/plain"));
  const draggedElement = document.getElementById(draggedIndex);
  const draggedTask = model.getTask(draggedIndex);

  // Target element
  const targetElement = event.target.closest(".todo-list__todo");
  const targetIndex = Number(targetElement.id);
  const targetTask = model.getTask(targetIndex);

  // Early return
  if (!draggedElement || !targetElement) return; // Safety check
  if (targetIndex === draggedIndex) return; // Exit if same elements

  // dragget logic

  // -------------------- From bottom to top --------------------
  if (targetElement.offsetTop < draggedElement.offsetTop) {
    console.log("From bottom to top");

    const newOrderFromDragged = targetTask.order;

    model.getTasksOrdered().forEach((task) => {
      if (newOrderFromDragged <= task.order && task.order < draggedTask.order) {
        task.order += 1;
      }
    });
    draggedTask.order = newOrderFromDragged;

    model.saveData();

    todoContainer.insertBefore(draggedElement, targetElement);
  }
  // -------------------- From top to bottom --------------------
  else {
    console.log("From top to bottom");

    const newOrderFromDragged = targetTask.order;

    model.getTasksOrdered().forEach((task) => {
      if (newOrderFromDragged < task.order && task.order <= targetTask.order) {
        task.order -= 1;
      }
    });
    draggedTask.order = newOrderFromDragged;

    model.saveData();

    todoContainer.insertBefore(draggedElement, targetElement.nextSibling);
  }
});

// --------------- start app ---------------

function initApp() {
  todoContainer.innerHTML = "";

  model.getTasksOrdered().forEach(addTaskUI);
  updateItemsLeft(model.getTasks());
}

initApp();
