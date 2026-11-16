const authScreen = document.getElementById('authScreen');
const appShell = document.getElementById('appShell');
const userLoginForm = document.getElementById('userLoginForm');
const adminLoginForm = document.getElementById('adminLoginForm');
const userNameInput = document.getElementById('userName');
const adminUserInput = document.getElementById('adminUser');
const adminPasswordInput = document.getElementById('adminPassword');
const monthLabel = document.getElementById('monthLabel');
const calendarGrid = document.getElementById('calendarGrid');
const selectedDateLabel = document.getElementById('selectedDateLabel');
const dateDescription = document.getElementById('dateDescription');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userBadge = document.getElementById('userBadge');
const eventForm = document.getElementById('eventForm');
const eventTitleInput = document.getElementById('eventTitle');
const appointmentTypeSelect = document.getElementById('appointmentType');
const groupTypeSelect = document.getElementById('groupType');
const groupTypeField = document.getElementById('groupTypeField');
const groupTypeOptions = document.getElementById('groupTypeOptions');
const groupTypeTrigger = document.getElementById('groupTypeTrigger');
const eventList = document.getElementById('eventList');
const reuniaoField = document.getElementById('reuniaoField');
const reuniaoNumeroSelect = document.getElementById('reuniaoNumero');
const taskReuniaoField = document.getElementById('taskReuniaoField');
const taskReuniaoNumeroSelect = document.getElementById('taskReuniaoNumero');
const taskPreview = document.getElementById('taskPreview');
const taskPreviewList = document.getElementById('taskPreviewList');
const userTasksPanel = document.getElementById('userTasksPanel');
const userTasksList = document.getElementById('userTasksList');
const upcomingEventsPanel = document.getElementById('upcomingEventsPanel');
const upcomingEventsList = document.getElementById('upcomingEventsList');

const STORAGE_KEY = 'calendar-compromissos';
const USER_AUTH_KEY = 'calendar-user-auth';
const ADMIN_AUTH_KEY = 'calendar-admin-auth';

const groupOrder = ['logistica', 'musica', 'comunicacao', 'acao-social', 'retiro', 'grupo-reunioes'];

const groups = [
  { id: 'logistica', label: 'Logística', emoji: '🚚' },
  { id: 'musica', label: 'Música', emoji: '🎵' },
  { id: 'comunicacao', label: 'Comunicação', emoji: '📢' },
  { id: 'acao-social', label: 'Ação Social', emoji: '🤝' },
  { id: 'retiro', label: 'Retiro', emoji: '⛺' },
  { id: 'grupo-reunioes', label: 'Grupo de Reuniões', emoji: '🧑‍🤝‍🧑' },
];

const appointmentTypes = [
  { id: 'reunioes', label: 'Reuniões', emoji: '📅', color: '#8b4a53' },
  { id: 'angariacoes', label: 'Arrecadação de Fundos', emoji: '💰', color: '#b56972' },
  { id: 'atividades', label: 'Atividades', emoji: '🎯', color: '#b06d64' },
  { id: 'aniversarios', label: 'Aniversários', emoji: '🎂', color: '#d6808d' },
  { id: 'retiro', label: 'Retiro', emoji: '⛺', color: '#a55d4f' },
  { id: 'acao-social', label: 'Ação Social', emoji: '🤝', color: '#b8737d' },
  { id: 'voluntariado', label: 'Voluntariado', emoji: '🙌', color: '#7a6d6d' },
];

const today = new Date();
let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date(today);
let appointments = loadAppointments();
let currentUser = loadCurrentSession();

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getGroup(groupId) {
  return groups.find((group) => group.id === groupId) || groups[0];
}

function getAppointmentType(typeId) {
  return appointmentTypes.find((type) => type.id === typeId) || appointmentTypes[0];
}

function loadAppointments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveAppointments() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

function loadCurrentSession() {
  const page = document.body.dataset.page;
  const key = page === 'admin' ? ADMIN_AUTH_KEY : USER_AUTH_KEY;

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCurrentSession(user) {
  const page = document.body.dataset.page;
  localStorage.setItem(page === 'admin' ? ADMIN_AUTH_KEY : USER_AUTH_KEY, JSON.stringify(user));
}

function clearCurrentSession() {
  const page = document.body.dataset.page;
  localStorage.removeItem(page === 'admin' ? ADMIN_AUTH_KEY : USER_AUTH_KEY);
}

function getOrderedGroupIds(ids) {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))];
  return groupOrder.filter((groupId) => uniqueIds.includes(groupId));
}

function getAppointmentGroupIds(appointment) {
  if (Array.isArray(appointment.groupIds) && appointment.groupIds.length) {
    return getOrderedGroupIds(appointment.groupIds);
  }

  if (Array.isArray(appointment.groups) && appointment.groups.length) {
    return getOrderedGroupIds(appointment.groups);
  }

  if (appointment.groupId) {
    return getOrderedGroupIds([appointment.groupId]);
  }

  return [];
}

function getAppointmentGroupLabel(appointment) {
  const ids = getAppointmentGroupIds(appointment);
  return ids.length ? ids.map((groupId) => getGroup(groupId).emoji + ' ' + getGroup(groupId).label).join(', ') : 'Sem grupo';
}

function isUserTask(appointment) {
  if (!currentUser || currentUser.role === 'admin') return true;

  const groupIds = getAppointmentGroupIds(appointment);
  const matches = groupIds.filter((groupId) => currentUser.groups.includes(groupId));

  if (!matches.length) return false;

  if (!groupIds.includes('grupo-reunioes')) return true;

  if (matches.includes('grupo-reunioes')) {
    return Number(appointment.reuniaoNumero) === Number(currentUser.reuniaoNumero);
  }

  return true;
}

function matchesUserGroup(appointment) {
  if (!currentUser || currentUser.role === 'admin') return true;

  const groupIds = getAppointmentGroupIds(appointment);
  if (!groupIds.length) return false;

  const sharedGroup = groupIds.some((groupId) => currentUser.groups.includes(groupId));
  if (!sharedGroup) return false;

  if (groupIds.includes('grupo-reunioes') && currentUser.groups.includes('grupo-reunioes')) {
    return true;
  }

  return true;
}

function expandRecurringAppointments(list) {
  const now = new Date();
  const firstYear = now.getFullYear() - 1;
  const lastYear = now.getFullYear() + 8;

  return list.flatMap((appointment) => {
    if (appointment.typeId !== 'aniversarios' || !appointment.date) {
      return [appointment];
    }

    const [year, month, day] = appointment.date.split('-').map(Number);
    if (!year || !month || !day) return [appointment];

    const items = [];
    for (let nextYear = firstYear; nextYear <= lastYear; nextYear++) {
      const recurringDate = new Date(nextYear, month - 1, day);
      if (Number.isNaN(recurringDate.getTime())) continue;

      items.push({
        ...appointment,
        id: `${appointment.id}-${nextYear}`,
        date: dateKey(recurringDate),
        recurringYear: nextYear,
        originalId: appointment.id,
      });
    }

    return items;
  });
}

function getVisibleAppointments() {
  if (!currentUser) return [];
  const expanded = expandRecurringAppointments(appointments);
  if (currentUser.role === 'admin') return expanded;
  return expanded.filter((appointment) => matchesUserGroup(appointment));
}

function getSelectedGroupValues() {
  if (!groupTypeSelect) return [];
  const selectedValues = Array.from(groupTypeSelect.selectedOptions).map((option) => option.value);
  return getOrderedGroupIds(selectedValues);
}

function syncGroupSelectionUI() {
  if (!groupTypeSelect || !groupTypeOptions || !groupTypeTrigger) return;

  const selectedValues = getSelectedGroupValues();
  const triggerLabel = groupTypeTrigger.querySelector('.multi-select-label');

  if (triggerLabel) {
    triggerLabel.textContent = selectedValues.length
      ? selectedValues.length === 1
        ? getGroup(selectedValues[0]).label
        : `${selectedValues.length} grupos selecionados`
      : 'Selecionar grupos';
  }

  Array.from(groupTypeOptions.querySelectorAll('input[type="checkbox"]')).forEach((checkbox) => {
    checkbox.checked = selectedValues.includes(checkbox.value);
  });
}

function renderGroupOptions() {
  if (!groupTypeSelect || !groupTypeOptions) return;

  const availableGroups = (currentUser && currentUser.role === 'admin'
    ? groups
    : groups.filter((group) => currentUser && currentUser.groups.includes(group.id)));

  const orderedGroups = availableGroups.slice().sort((a, b) => groupOrder.indexOf(a.id) - groupOrder.indexOf(b.id));

  const selectOptions = orderedGroups
    .map((group) => `<option value="${group.id}">${group.emoji} ${group.label}</option>`)
    .join('');

  groupTypeSelect.innerHTML = selectOptions || '<option value="">Sem grupo</option>';
  groupTypeSelect.disabled = !orderedGroups.length;
  groupTypeSelect.multiple = true;

  groupTypeOptions.innerHTML = orderedGroups
    .map((group) => `
      <label class="multi-select-option">
        <input type="checkbox" value="${group.id}" />
        <span>${group.emoji} ${group.label}</span>
      </label>
    `)
    .join('') || '<span class="task-empty">Sem grupos disponíveis</span>';

  syncGroupSelectionUI();
}

function toggleReuniaoField() {
  if (!reuniaoField) return;
  const checked = Array.from(document.querySelectorAll('input[name="group"]:checked')).map((input) => input.value);
  const shouldShow = checked.includes('grupo-reunioes');
  reuniaoField.classList.toggle('hidden', !shouldShow);
  renderLoginTaskPreview();
}

function toggleTaskReuniaoField() {
  if (!taskReuniaoField || !groupTypeSelect) return;
  taskReuniaoField.classList.toggle('hidden', groupTypeSelect.value !== 'grupo-reunioes');
}

function renderLoginTaskPreview() {
  if (!taskPreview || !taskPreviewList) return;

  const checkedGroups = Array.from(document.querySelectorAll('input[name="group"]:checked')).map((input) => input.value);

  if (!checkedGroups.length) {
    taskPreview.classList.add('hidden');
    taskPreviewList.innerHTML = '';
    return;
  }

  const items = appointments
    .filter((appointment) => getAppointmentGroupIds(appointment).some((groupId) => checkedGroups.includes(groupId)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

  if (!items.length) {
    taskPreview.classList.remove('hidden');
    taskPreviewList.innerHTML = '<li class="task-empty">Ainda não há tarefas agendadas para estes grupos.</li>';
    return;
  }

  taskPreview.classList.remove('hidden');
  taskPreviewList.innerHTML = items
    .map((appointment) => {
      const type = getAppointmentType(appointment.typeId);
      const date = new Date(`${appointment.date}T00:00:00`);
      return `
        <li class="task-item">
          <span class="task-date">${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)}</span>
          <div class="task-content">
            <div class="task-title-row">
              <span class="type-icon" aria-label="${type.label}">${type.emoji}</span>
              <strong>${appointment.title}</strong>
            </div>
            <small>${type.label} • ${getAppointmentGroupLabel(appointment)}</small>
          </div>
        </li>
      `;
    })
    .join('');
}

function renderUserTasks() {
  if (!userTasksPanel || !userTasksList) return;

  if (!currentUser || currentUser.role === 'admin') {
    userTasksPanel.classList.add('hidden');
    userTasksList.innerHTML = '';
    return;
  }

  const items = appointments
    .filter((appointment) => isUserTask(appointment))
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

  if (!items.length) {
    userTasksPanel.classList.remove('hidden');
    userTasksList.innerHTML = '<li class="user-task-empty">Ainda não há tarefas atribuídas aos seus grupos.</li>';
    return;
  }

  userTasksPanel.classList.remove('hidden');
  userTasksList.innerHTML = items
    .map((appointment) => {
      const type = getAppointmentType(appointment.typeId);
      const date = new Date(`${appointment.date}T00:00:00`);
      return `
        <li class="user-task-item">
          <span class="user-task-date">${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)}</span>
          <div class="task-content">
            <div class="task-title-row">
              <span class="type-icon" aria-label="${type.label}">${type.emoji}</span>
              <strong>${appointment.title}</strong>
            </div>
            <small>${type.label} • ${getAppointmentGroupLabel(appointment)}</small>
          </div>
        </li>
      `;
    })
    .join('');
}

function renderUpcomingEvents() {
  if (!upcomingEventsPanel || !upcomingEventsList) return;

  if (!currentUser || currentUser.role === 'admin') {
    upcomingEventsPanel.classList.add('hidden');
    upcomingEventsList.innerHTML = '';
    return;
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 60);
  endDate.setHours(23, 59, 59, 999);

  const items = expandRecurringAppointments(appointments)
    .filter((appointment) => {
      const eventDate = new Date(`${appointment.date}T00:00:00`);
      return eventDate >= startDate && eventDate <= endDate;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

  if (!items.length) {
    upcomingEventsPanel.classList.remove('hidden');
    upcomingEventsList.innerHTML = '<li class="user-task-empty">Ainda não há eventos futuros atribuídos nos próximos 60 dias.</li>';
    return;
  }

  upcomingEventsPanel.classList.remove('hidden');
  upcomingEventsList.innerHTML = items
    .map((appointment) => {
      const type = getAppointmentType(appointment.typeId);
      const date = new Date(`${appointment.date}T00:00:00`);
      return `
        <li class="user-task-item">
          <span class="user-task-date">${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)}</span>
          <div class="task-content">
            <div class="task-title-row">
              <span class="type-icon" aria-label="${type.label}">${type.emoji}</span>
              <strong>${appointment.title}</strong>
            </div>
            <small>${type.label} • ${getAppointmentGroupLabel(appointment)}</small>
          </div>
        </li>
      `;
    })
    .join('');
}

function renderEventList() {
  if (!eventList) return;

  const visibleItems = getVisibleAppointments().filter((appointment) => appointment.date === dateKey(selectedDate));
  const canRemove = currentUser && currentUser.role === 'admin';

  if (!visibleItems.length) {
    eventList.innerHTML = '<li class="empty-events">Nenhum compromisso marcado para esta data.</li>';
    return;
  }

  eventList.innerHTML = visibleItems
    .map((appointment) => {
      const type = getAppointmentType(appointment.typeId);
      const removeId = appointment.originalId || appointment.id;
      return `
        <li class="event-item" style="--event-color: ${type.color};">
          <span class="event-main">
            <span class="event-badge" style="background: ${type.color};">${type.emoji}</span>
            <span>
              <strong>${appointment.title}</strong>
              <small>${type.label} • ${getAppointmentGroupLabel(appointment)}${appointment.recurringYear ? ` • ${appointment.recurringYear}` : ''}</small>
            </span>
          </span>
          ${canRemove ? `<button type="button" class="remove-event-btn" data-remove-id="${removeId}" aria-label="Remover compromisso">×</button>` : ''}
        </li>
      `;
    })
    .join('');
}

function renderCalendar() {
  if (!monthLabel || !calendarGrid) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthLabelValue = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate);
  monthLabel.textContent = monthLabelValue.charAt(0).toUpperCase() + monthLabelValue.slice(1);

  const firstDayOfMonth = new Date(year, month, 1);
  const totalCells = 42;
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const dates = [];

  for (let i = 0; i < totalCells; i++) {
    const day = i - startOffset + 1;
    dates.push(new Date(year, month, day));
  }

  calendarGrid.innerHTML = '';

  dates.forEach((date) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'day';

    const isInMonth = date.getMonth() === month;
    const visibleEvents = getVisibleAppointments().filter((appointment) => appointment.date === dateKey(date));

    if (!isInMonth) button.classList.add('outside-month');
    if (isSameDay(date, today)) button.classList.add('today');
    if (isSameDay(date, selectedDate)) button.classList.add('selected');
    if (visibleEvents.length > 0) {
      button.classList.add('has-event');
      button.style.setProperty('--event-dot-color', getAppointmentType(visibleEvents[0].typeId).color);
    }

    button.textContent = date.getDate();
    button.setAttribute('aria-label', formatDate(date));
    button.addEventListener('click', () => {
      selectedDate = new Date(date);
      renderCalendar();
      updateSelectedDatePanel();
    });

    calendarGrid.appendChild(button);
  });

  updateSelectedDatePanel();
  renderUserTasks();
  renderUpcomingEvents();
}

function updateSelectedDatePanel() {
  if (!selectedDateLabel || !dateDescription || !eventList) return;

  selectedDateLabel.textContent = formatDate(selectedDate);
  const items = getVisibleAppointments().filter((appointment) => appointment.date === dateKey(selectedDate));

  if (!items.length) {
    dateDescription.textContent = isSameDay(selectedDate, today)
      ? 'Hoje não há compromissos marcados.'
      : 'Nenhum compromisso para esta data.';
  } else if (items.length === 1) {
    dateDescription.textContent = '1 compromisso marcado para esta data.';
  } else {
    dateDescription.textContent = `${items.length} compromissos marcados para esta data.`;
  }

  renderEventList();
}

function applyAuthState() {
  if (!currentUser || !currentUser.groups || currentUser.groups.length === 0) {
    if (authScreen) authScreen.classList.remove('hidden');
    if (appShell) appShell.classList.add('hidden');
    if (taskPreview) renderLoginTaskPreview();
    return;
  }

  if (authScreen) authScreen.classList.add('hidden');
  if (appShell) appShell.classList.remove('hidden');

  if (userBadge) {
    userBadge.textContent = `${currentUser.name} · ${currentUser.role === 'admin' ? 'Administrador' : 'Utilizador'}`;
  }

  if (groupTypeSelect) renderGroupOptions();
  renderUserTasks();
  renderUpcomingEvents();

  if (eventForm) {
    eventForm.classList.toggle('hidden', currentUser.role !== 'admin');
  }
}

if (userLoginForm) {
  userLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = userNameInput.value.trim();
    const checkedGroups = Array.from(document.querySelectorAll('input[name="group"]:checked')).map((input) => input.value);

    if (!name || checkedGroups.length === 0) {
      alert('Informe o nome e selecione pelo menos um grupo.');
      return;
    }

    currentUser = {
      name,
      role: 'user',
      groups: checkedGroups,
      reuniaoNumero: checkedGroups.includes('grupo-reunioes') && reuniaoNumeroSelect ? Number(reuniaoNumeroSelect.value) : null,
    };

    saveCurrentSession(currentUser);
    applyAuthState();
    renderCalendar();
  });

  Array.from(document.querySelectorAll('input[name="group"]')).forEach((checkbox) => {
    checkbox.addEventListener('change', toggleReuniaoField);
  });

  if (reuniaoNumeroSelect) {
    reuniaoNumeroSelect.addEventListener('change', renderLoginTaskPreview);
  }
}

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = adminUserInput.value.trim();
    const password = adminPasswordInput.value.trim();

    if (username !== 'admin' || password !== 'admingjADV') {
      alert('Credenciais de administrador inválidas.');
      return;
    }

    currentUser = {
      name: 'Administrador',
      role: 'admin',
      groups: groups.map((group) => group.id),
    };

    saveCurrentSession(currentUser);
    applyAuthState();
    renderCalendar();
  });
}

if (groupTypeTrigger) {
  groupTypeTrigger.addEventListener('click', () => {
    const field = groupTypeTrigger.closest('.multi-select-field');
    if (!field) return;

    const shouldOpen = !field.classList.contains('is-open');
    field.classList.toggle('is-open', shouldOpen);
    groupTypeTrigger.setAttribute('aria-expanded', String(shouldOpen));
  });
}

if (groupTypeOptions) {
  groupTypeOptions.addEventListener('change', (event) => {
    const checkbox = event.target;
    if (!(checkbox instanceof HTMLInputElement) || checkbox.type !== 'checkbox') return;

    const selectedValues = getOrderedGroupIds(Array.from(groupTypeOptions.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value));
    Array.from(groupTypeSelect.options).forEach((option) => {
      option.selected = selectedValues.includes(option.value);
    });

    syncGroupSelectionUI();

    const hasReuniao = selectedValues.includes('grupo-reunioes');
    if (taskReuniaoField) taskReuniaoField.classList.toggle('hidden', !hasReuniao);
  });
}

if (groupTypeSelect) {
  groupTypeSelect.addEventListener('change', () => {
    syncGroupSelectionUI();
    const hasReuniao = getSelectedGroupValues().includes('grupo-reunioes');
    if (taskReuniaoField) taskReuniaoField.classList.toggle('hidden', !hasReuniao);
  });
}

document.addEventListener('click', (event) => {
  const field = event.target.closest('.multi-select-field');
  if (!field) {
    document.querySelectorAll('.multi-select-field').forEach((item) => {
      item.classList.remove('is-open');
      const trigger = item.querySelector('.multi-select-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
    return;
  }

  if (event.target.closest('.multi-select-trigger')) return;

  if (event.target.closest('.multi-select-option')) return;

  document.querySelectorAll('.multi-select-field').forEach((item) => {
    if (item !== field) {
      item.classList.remove('is-open');
      const trigger = item.querySelector('.multi-select-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }
  });
});

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    currentUser = null;
    clearCurrentSession();
    applyAuthState();
  });
}

if (prevMonthBtn) {
  prevMonthBtn.addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    renderCalendar();
  });
}

if (nextMonthBtn) {
  nextMonthBtn.addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    renderCalendar();
  });
}

if (todayBtn) {
  todayBtn.addEventListener('click', () => {
    currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    selectedDate = new Date(today);
    renderCalendar();
  });
}

if (eventForm) {
  eventForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!currentUser || currentUser.role !== 'admin') {
      alert('Apenas administradores podem adicionar compromissos.');
      return;
    }

    const title = eventTitleInput.value.trim();
    const typeId = appointmentTypeSelect.value;
    const selectedGroups = getSelectedGroupValues();
    const groupId = selectedGroups[0] || null;
    const reuniaoNumero = selectedGroups.includes('grupo-reunioes') && taskReuniaoNumeroSelect ? Number(taskReuniaoNumeroSelect.value) : null;

    if (!title || !selectedGroups.length) {
      alert('Selecione pelo menos um grupo antes de adicionar o compromisso.');
      return;
    }

    appointments.push({
      id: Date.now(),
      date: dateKey(selectedDate),
      title,
      typeId,
      groupId,
      groupIds: selectedGroups,
      reuniaoNumero,
    });

    appointments.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    saveAppointments();

    eventTitleInput.value = '';
    if (groupTypeSelect) {
      Array.from(groupTypeSelect.options).forEach((option) => {
        option.selected = false;
      });
      syncGroupSelectionUI();
    }
    if (taskReuniaoNumeroSelect) taskReuniaoNumeroSelect.value = '1';
    if (taskReuniaoField) taskReuniaoField.classList.add('hidden');

    renderCalendar();
    renderLoginTaskPreview();
  });
}

if (eventList) {
  eventList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-id]');
    if (!button) return;

    const idToRemove = Number(button.dataset.removeId);
    appointments = appointments.filter((appointment) => appointment.id !== idToRemove);
    saveAppointments();
    renderCalendar();
  });
}

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY || event.key === USER_AUTH_KEY || event.key === ADMIN_AUTH_KEY) {
    appointments = loadAppointments();
    currentUser = loadCurrentSession();
    applyAuthState();
    if (currentUser) renderCalendar();
  }
});

setInterval(() => {
  const nowAppointments = loadAppointments();
  const nowSession = loadCurrentSession();
  const sessionChanged = JSON.stringify(nowSession) !== JSON.stringify(currentUser);
  const appointmentsChanged = JSON.stringify(nowAppointments) !== JSON.stringify(appointments);

  if (sessionChanged || appointmentsChanged) {
    appointments = nowAppointments;
    currentUser = nowSession;
    applyAuthState();
    if (currentUser) renderCalendar();
  }
}, 1200);

if (document.body.dataset.page === 'user') {
  toggleReuniaoField();
}

applyAuthState();
if (currentUser) renderCalendar();
