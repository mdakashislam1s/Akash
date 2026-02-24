const STORAGE_KEY = 'perfect_todo_items_v1';
const THEME_KEY = 'perfect_todo_theme_v1';

const dom = {
  input: document.querySelector('#newTodo'),
  addButton: document.querySelector('#addTodoBtn'),
  list: document.querySelector('#todoList'),
  itemsLeft: document.querySelector('#itemsLeft'),
  completionRate: document.querySelector('#completionRate'),
  clearCompleted: document.querySelector('#clearCompleted'),
  filters: document.querySelectorAll('.filter'),
  itemTemplate: document.querySelector('#todoItemTemplate'),
  themeButton: document.querySelector('#toggleTheme')
};

const state = {
  todos: loadTodos(),
  filter: 'all'
};

initTheme();
attachEvents();
render();

function attachEvents() {
  dom.addButton.addEventListener('click', addTodoFromInput);
  dom.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      addTodoFromInput();
    }
  });

  dom.filters.forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      dom.filters.forEach((b) => {
        const active = b === button;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      render();
    });
  });

  dom.clearCompleted.addEventListener('click', () => {
    state.todos = state.todos.filter((todo) => !todo.completed);
    saveTodos();
    render();
  });

  dom.themeButton.addEventListener('click', toggleTheme);
}

function addTodoFromInput() {
  const text = dom.input.value.trim();
  if (!text) {
    dom.input.focus();
    return;
  }

  state.todos.unshift({
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: Date.now()
  });

  dom.input.value = '';
  saveTodos();
  render();
  dom.input.focus();
}

function render() {
  dom.list.innerHTML = '';

  const filtered = getFilteredTodos();
  if (!filtered.length) {
    const empty = document.createElement('li');
    empty.className = 'todo-item';
    empty.textContent = state.todos.length
      ? 'No tasks match this filter.'
      : 'No tasks yet — add one above.';
    dom.list.append(empty);
  } else {
    filtered.forEach((todo) => {
      const item = createTodoItem(todo);
      dom.list.append(item);
    });
  }

  const activeCount = state.todos.filter((todo) => !todo.completed).length;
  const completion = state.todos.length
    ? Math.round((100 * (state.todos.length - activeCount)) / state.todos.length)
    : 0;

  dom.itemsLeft.textContent = `${activeCount} item${activeCount === 1 ? '' : 's'} left`;
  dom.completionRate.textContent = `${completion}% complete`;
}

function createTodoItem(todo) {
  const fragment = dom.itemTemplate.content.cloneNode(true);
  const item = fragment.querySelector('.todo-item');
  const toggle = fragment.querySelector('.todo-item__toggle');
  const text = fragment.querySelector('.todo-item__text');
  const meta = fragment.querySelector('.todo-item__meta');
  const editBtn = fragment.querySelector('.todo-item__edit');
  const deleteBtn = fragment.querySelector('.todo-item__delete');

  text.textContent = todo.text;
  meta.textContent = `Created ${new Date(todo.createdAt).toLocaleString()}`;
  toggle.checked = todo.completed;

  if (todo.completed) {
    item.classList.add('todo-item--done');
  }

  toggle.addEventListener('change', () => {
    todo.completed = toggle.checked;
    saveTodos();
    render();
  });

  editBtn.addEventListener('click', () => {
    const updated = prompt('Edit task:', todo.text);
    if (updated === null) {
      return;
    }
    const cleaned = updated.trim();
    if (!cleaned) {
      return;
    }
    todo.text = cleaned;
    saveTodos();
    render();
  });

  deleteBtn.addEventListener('click', () => {
    state.todos = state.todos.filter((t) => t.id !== todo.id);
    saveTodos();
    render();
  });

  return item;
}

function getFilteredTodos() {
  if (state.filter === 'active') {
    return state.todos.filter((todo) => !todo.completed);
  }
  if (state.filter === 'completed') {
    return state.todos.filter((todo) => todo.completed);
  }
  return state.todos;
}

function loadTodos() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidTodo);
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function isValidTodo(todo) {
  return (
    typeof todo === 'object' &&
    todo !== null &&
    typeof todo.id === 'string' &&
    typeof todo.text === 'string' &&
    typeof todo.completed === 'boolean' &&
    typeof todo.createdAt === 'number'
  );
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);
}
