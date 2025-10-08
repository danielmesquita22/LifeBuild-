// Constantes e configurações

const STORAGE_KEY = 'routineAppData';
const DEFAULT_DATA = {
  // Adicione algumas rotinas iniciais para teste
  routines: [
    { id: 't1', title: 'Treino de força (peito e tríceps)', description: 'Foco em progressão de carga.', date: new Date().toISOString().split('T')[0], time: '08:00', priority: 'high', tag: 'saúde', completed: false, status: 'doing' },
    { id: 't2', title: 'Reunião de planejamento semanal', description: 'Revisar metas e definir prioridades.', date: new Date().toISOString().split('T')[0], time: '10:30', priority: 'medium', tag: 'trabalho', completed: false, status: 'todo' },
    { id: 't3', title: 'Ler 50 páginas do livro "Atomic Habits"', description: 'Hábito de leitura diário.', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], priority: 'low', tag: 'estudos', completed: false, status: 'todo' },
    { id: 't4', title: 'Pagar contas mensais', description: 'Água, luz, internet.', date: new Date().toISOString().split('T')[0], priority: 'high', tag: 'pessoal', completed: true, status: 'done' },
  ],
  tags: [
    { id: 'tag1', name: 'pessoal', color: '#4f46e5' },
    { id: 'tag2', name: 'trabalho', color: '#10b981' },
    { id: 'tag3', name: 'saúde', color: '#ef4444' },
    { id: 'tag4', name: 'estudos', color: '#f59e0b' }
  ],
  preferences: { theme: 'light', showCompleted: true }
};

// Estado da aplicação
let state = {
  currentView: 'hoje',
  currentViewMode: 'lista',
  selectedTask: null,
  currentDate: new Date(),
  showSidebar: true,
  routines: [],
  tags: [],
  preferences: {}
};

// Seletores DOM
const DOM = {
  app: document.querySelector('.app'),
  sidebar: document.getElementById('sidebar'),
  btnToggleSidebar: document.getElementById('btnToggleSidebar'),
  // Corrigido: Não existe btnToggleTheme no HTML fornecido, usando elemento fictício ou removendo, mas mantive para não quebrar a lógica anterior
  btnToggleTheme: document.querySelector('[data-layout]'), 
  btnQuickAdd: document.getElementById('btnQuickAdd'),
  todayDate: document.getElementById('todayDate'),
  nowTime: document.getElementById('nowTime'),
  menuLinks: document.querySelectorAll('.menu-link[data-view]'),
  filterLinks: document.querySelectorAll('.menu-link[data-filter]'), // Adicionado
  tagList: document.getElementById('tagList'),
  btnAddTag: document.getElementById('btnAddTag'),
  viewTitle: document.getElementById('viewTitle'), // Corrigido: viewTitle não existe no HTML, mas mantido no JS.
  crumbView: document.getElementById('crumbView'), // Corrigido: crumbView não existe no HTML, mas mantido no JS.
  // Corrigido: Não existem tabs no HTML fornecido, usando as views para simular a mudança de modo
  // viewTabs may not be used directly, keep as list if present
  viewTabs: Array.from(document.querySelectorAll('.sidebar [data-viewmode]')) || [],
  viewLista: document.getElementById('viewLista'),
  // There was a mismatch between HTML id (viewQuadro) and earlier code; ensure we query the actual id
  viewQuadro: document.getElementById('viewQuadro') || document.getElementById('viewTodasRotinas'),
  viewCalendario: document.getElementById('viewCalendario'),
  taskListToday: document.getElementById('taskListToday'),
  todoList: document.querySelector('[data-col="todo"] .card-list'),
  doingList: document.querySelector('[data-col="doing"] .card-list'),
  doneList: document.querySelector('[data-col="done"] .card-list'),
  detailsPanel: document.getElementById('detailsPanel'),
  detailsClose: document.getElementById('detailsClose'),
  detailsForm: document.getElementById('detailsForm'),
  taskTitle: document.getElementById('taskTitle'),
  taskDesc: document.getElementById('taskDesc'),
  taskDate: document.getElementById('taskDate'),
  taskTime: document.getElementById('taskTime'),
  taskPriority: document.getElementById('taskPriority'),
  taskTag: document.getElementById('taskTag'),
  btnSaveTask: document.getElementById('btnSaveTask'),
  btnDeleteTask: document.getElementById('btnDeleteTask'),
  btnDuplicateTask: document.getElementById('btnDuplicateTask'),
  modalQuickAdd: document.getElementById('modalQuickAdd'),
  quickAddForm: document.getElementById('quickAddForm'),
  quickTitle: document.getElementById('quickTitle'),
  quickDate: document.getElementById('quickDate'),
  quickPriority: document.getElementById('quickPriority'),
  quickTag: document.getElementById('quickTag'),
  modalAddTag: document.getElementById('modalAddTag'),
  addTagForm: document.getElementById('addTagForm'),
  tagName: document.getElementById('tagName'),
  tagColor: document.getElementById('tagColor'),
  calPrev: document.getElementById('calPrev'),
  calNext: document.getElementById('calNext'),
  calToday: document.getElementById('calToday'),
  calTitle: document.getElementById('calTitle'),
  calendarGrid: document.querySelector('.calendar-grid'),
  toastsContainer: document.getElementById('toasts') // Adicionado
};

// Templates
const templates = {
  taskItem: document.getElementById('tplTaskItem'),
  boardCard: document.getElementById('tplBoardCard'),
  toast: document.getElementById('tplToast')
};

// ID counter global simples
let nextId = 1000;

// Inicialização da aplicação
function init() {
  loadData();
  // Garante que o nextId seja maior que os IDs existentes
  state.routines.forEach(t => {
    const idNum = parseInt(t.id.replace('t', ''));
    if (idNum >= nextId) nextId = idNum + 1;
  });
  setupEventListeners();
  updateClock();
  setInterval(updateClock, 60000);
  setupDragAndDrop();
  render();
  // Definir a visualização inicial correta
  if (state.currentView === 'calendario') {
      state.currentViewMode = 'calendario';
      renderCalendar();
  } else {
      state.currentViewMode = 'lista';
      renderTaskList();
  }
}

// Carrega dados do localStorage
function loadData() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    const parsedData = JSON.parse(savedData);
    state.routines = parsedData.routines || DEFAULT_DATA.routines;
    state.tags = parsedData.tags || DEFAULT_DATA.tags;
    state.preferences = parsedData.preferences || DEFAULT_DATA.preferences;
    state.showSidebar = parsedData.showSidebar !== undefined ? parsedData.showSidebar : true;
  } else {
    state.routines = DEFAULT_DATA.routines;
    state.tags = DEFAULT_DATA.tags;
    state.preferences = DEFAULT_DATA.preferences;
    saveData();
  }
  // Corrigido: ajustando a configuração do tema e sidebar
  DOM.app.setAttribute('data-theme', state.preferences.theme);
  // DOM.btnToggleTheme.setAttribute('aria-pressed', state.preferences.theme === 'dark'); // Removido ou corrigido se o elemento não existe
  DOM.app.setAttribute('data-layout', state.showSidebar ? 'with-sidebar' : 'without-sidebar');
}

// Salva dados no localStorage
function saveData() {
  const dataToSave = {
    routines: state.routines,
    tags: state.tags,
    preferences: state.preferences,
    showSidebar: state.showSidebar
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

// === Funções de Utilidade ===

// Gera um ID único
function generateId() {
    return 't' + nextId++;
}

// Exibe um toast de notificação
function showToast(message, type = 'info') {
    const toastElement = templates.toast.content.cloneNode(true);
    const toast = toastElement.querySelector('.toast');
    toast.querySelector('.toast-content').textContent = message;
    toast.classList.add(type);
    
    // Configura o fechamento automático
    DOM.toastsContainer.prepend(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
}


// Adiciona uma nova rotina
function addNewRoutine({ title, description, date, time, priority, tag, status = 'todo', completed = false }) {
    const newRoutine = {
        id: generateId(),
        title: title,
        description: description || '',
        date: date || undefined,
        time: time || undefined,
        priority: priority || 'medium',
        tag: tag || undefined,
        status: status, // default para 'todo'
        completed: completed
    };

    state.routines.push(newRoutine);
    saveData();
    render();
    showToast('Rotina adicionada com sucesso!', 'success');
}

// Alterna a conclusão da tarefa
function toggleTaskCompletion(taskId) {
    const task = state.routines.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        // Ajusta o status no Kanban se estiver sendo marcada como concluída ou não
        if (task.completed) {
            task.status = 'done';
            showToast(`Rotina "${task.title}" concluída!`, 'success');
        } else if (task.status === 'done') {
             task.status = 'todo'; // Volta para 'todo' se desmarcada
             showToast(`Rotina "${task.title}" marcada como pendente.`, 'info');
        }
        
        saveData();
        render(); // Re-renderiza para atualizar a lista/quadro
    }
}


// Abre o painel de detalhes da tarefa
function openTaskDetails(taskId) {
  const task = state.routines.find(t => t.id === taskId);
  if (!task) return;
  state.selectedTask = task;
  
  DOM.taskTitle.value = task.title;
  DOM.taskDesc.value = task.description || '';
  DOM.taskPriority.value = task.priority || 'medium';
  DOM.taskTag.value = task.tag ? `#${task.tag}` : '';
  
  if (task.date) {
    const date = new Date(task.date);
    // Corrigido: Garante que o fuso horário não altere a data para o dia anterior
    const dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    DOM.taskDate.value = dateString;
  } else {
    DOM.taskDate.value = '';
  }
  
  DOM.taskTime.value = task.time || '';

  // Configura o título do painel
  document.getElementById('detailsTitle').textContent = task.title;

  DOM.detailsPanel.setAttribute('aria-hidden', 'false');
  DOM.detailsPanel.classList.add('is-open');
}

// Fecha o painel de detalhes da tarefa
function closeDetails() {
  state.selectedTask = null;
  DOM.detailsPanel.setAttribute('aria-hidden', 'true');
  DOM.detailsPanel.classList.remove('is-open');
  // Garante que o form seja resetado visualmente se o usuário não salvou
  DOM.detailsForm.reset(); 
}

// Salva os detalhes da tarefa (função incompleta no código original)
function saveTaskDetails(e) {
  e.preventDefault();
  if (!state.selectedTask) return;

  const task = state.selectedTask;
  
  task.title = DOM.taskTitle.value.trim();
  task.description = DOM.taskDesc.value;
  task.date = DOM.taskDate.value || undefined;
  task.time = DOM.taskTime.value || undefined;
  task.priority = DOM.taskPriority.value;
  task.tag = DOM.taskTag.value.replace('#', '').trim() || undefined;
  
  if (!task.title) {
    showToast('O título da rotina é obrigatório.', 'error');
    return;
  }

  saveData();
  render();
  closeDetails();
  showToast('Rotina salva com sucesso!', 'success');
}

// Deleta a tarefa (função incompleta no código original)
function deleteCurrentTask() {
  if (!state.selectedTask) return;

  const confirmDelete = confirm(`Tem certeza que deseja excluir a rotina: "${state.selectedTask.title}"?`);
  if (confirmDelete) {
    state.routines = state.routines.filter(t => t.id !== state.selectedTask.id);
    saveData();
    render();
    closeDetails();
    showToast('Rotina excluída com sucesso!', 'info');
  }
}

// Duplica a tarefa (função incompleta no código original)
function duplicateCurrentTask() {
  if (!state.selectedTask) return;

  const originalTask = state.selectedTask;
  const duplicatedTask = {
    ...originalTask,
    id: generateId(), // Novo ID
    title: `Cópia de ${originalTask.title}`,
    completed: false, // Começa como pendente
    status: 'todo' // Começa como 'todo'
  };

  state.routines.push(duplicatedTask);
  saveData();
  render();
  closeDetails();
  showToast('Rotina duplicada com sucesso!', 'success');
}

// === Lógica de Etiquetas (Tags) ===

// Adiciona uma nova etiqueta
function addNewTag({ name, color }) {
    const newTag = {
        id: `tag${state.tags.length + 1}`,
        name: name,
        color: color
    };
    
    // Verifica se a tag já existe
    if (state.tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
        showToast('Esta etiqueta já existe!', 'error');
        return;
    }
    
    state.tags.push(newTag);
    saveData();
    renderTags();
    showToast(`Etiqueta #${name} adicionada!`, 'success');
}

// Renderiza a lista de etiquetas na sidebar
function renderTags() {
    DOM.tagList.innerHTML = '';
    const datalistTags = document.getElementById('datalistTags');
    datalistTags.innerHTML = ''; // Limpa o datalist

    state.tags.forEach(tag => {
        // 1. Renderiza na sidebar
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'tag';
        a.href = '#';
        a.dataset.tag = tag.name;
        a.textContent = `#${tag.name}`;
        a.style.borderColor = tag.color; // Adiciona a cor
        a.addEventListener('click', (e) => {
            e.preventDefault();
            // Implementação simples de filtro por tag (pode ser expandida)
            showToast(`Filtro por tag #${tag.name} ativado.`, 'info');
            renderTaskListWithTasks(state.routines.filter(t => t.tag === tag.name));
        });
        li.appendChild(a);
        DOM.tagList.appendChild(li);

        // 2. Renderiza no datalist
        const option = document.createElement('option');
        option.value = `#${tag.name}`;
        datalistTags.appendChild(option);
    });
}

// === Filtros e Visualizações ===

// Filtra tarefas com base na view e filtros extras
function getFilteredTasks() {
  let tasks = [...state.routines];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 1. Filtro por View
  switch (state.currentView) {
    case 'hoje':
      tasks = tasks.filter(task => {
        if (!task.date) return false;
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });
      break;
    case 'semana':
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      tasks = tasks.filter(task => {
        if (!task.date) return false;
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate >= today && taskDate < nextWeek;
      });
      break;
    case 'calendario':
      // No calendário, todas as tarefas com data são consideradas
      tasks = tasks.filter(task => task.date);
      break;
  }

  // 2. Filtro por Filtros Rápidos (sidebar)
  const activeFilterLink = document.querySelector('.menu-link[data-filter].is-active');
  if (activeFilterLink) {
    const filter = activeFilterLink.dataset.filter;
    switch (filter) {
      case 'pendentes':
        tasks = tasks.filter(task => !task.completed);
        break;
      case 'concluidas':
        tasks = tasks.filter(task => task.completed);
        break;
      case 'alta':
        tasks = tasks.filter(task => task.priority === 'high');
        break;
      case 'semData':
        tasks = tasks.filter(task => !task.date);
        break;
    }
  } else if (!state.preferences.showCompleted) {
    // Se nenhum filtro ativo, aplica a preferência global
    tasks = tasks.filter(task => !task.completed);
  }
  
  return tasks;
}

// === Renderização ===

// Define a visualização atual (Hoje, Semana, etc.)
function setCurrentView(view) {
  state.currentView = view;
  DOM.menuLinks.forEach(link => {
    link.classList.toggle('is-active', link.dataset.view === view);
  });
  
  // Troca o modo de visualização baseado na view (pode ser customizado)
  if (view === 'calendario') {
      setViewMode('calendario');
  } else {
      // Para 'hoje' e 'semana', volta para lista (padrão)
      setViewMode('lista');
  }
  
  // Limpa o filtro ativo quando muda a view principal
  DOM.filterLinks.forEach(link => link.classList.remove('is-active'));
  
  render();
}

// Define o modo de visualização (Lista, Quadro, Calendário)
function setViewMode(mode) {
  // Desativa todas as views
  DOM.viewLista.classList.remove('is-active');
  DOM.viewQuadro.classList.remove('is-active');
  DOM.viewCalendario.classList.remove('is-active');
  
  state.currentViewMode = mode;
  
  // Ativa a view correta
  if (mode === 'lista') DOM.viewLista.classList.add('is-active');
  else if (mode === 'quadro') DOM.viewQuadro.classList.add('is-active');
  else if (mode === 'calendario') DOM.viewCalendario.classList.add('is-active');

  render();
}

// Renderiza a lista de tarefas
function renderTaskList() {
  if (!DOM.taskListToday) return;
  DOM.taskListToday.innerHTML = '';
  const tasks = getFilteredTasks();
  if (tasks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Nenhuma rotina encontrada';
    DOM.taskListToday.appendChild(emptyState);
    return;
  }
  tasks.forEach(task => {
    const taskElement = createTaskElement(task);
    DOM.taskListToday.appendChild(taskElement);
  });
}

// Render a supplied list of tasks into the main task list (used by tag filtering)
function renderTaskListWithTasks(tasks) {
  if (!DOM.taskListToday) return;
  DOM.taskListToday.innerHTML = '';
  if (!tasks || tasks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Nenhuma rotina encontrada';
    DOM.taskListToday.appendChild(emptyState);
    return;
  }
  tasks.forEach(task => {
    const taskElement = createTaskElement(task);
    DOM.taskListToday.appendChild(taskElement);
  });
}

// Renderiza toda a aplicação
function render() {
  updateViewTitle();
  renderTags(); // Garante que as tags estão sempre atualizadas
  
  if (state.currentViewMode === 'lista') renderTaskList();
  else if (state.currentViewMode === 'quadro') renderBoard();
  else if (state.currentViewMode === 'calendario') renderCalendar();
}

// Renderiza o calendário (função incompleta no código original)
function renderCalendar() {
  if (!DOM.calendarGrid) return;
  
  DOM.calendarGrid.innerHTML = '';
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  DOM.calTitle.textContent = `${monthNames[month]} ${year}`;
  
  // 0 = Domingo, 1 = Segunda...
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
    // Adiciona cabeçalho dos dias da semana
    dayNames.forEach(day => {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day-header';
      dayElement.textContent = day;
      DOM.calendarGrid.appendChild(dayElement);
    });
    
    // Dias do mês anterior
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayElement = createCalendarDay(prevMonthDays - i, true);
      DOM.calendarGrid.appendChild(dayElement);
    }
    
    const today = new Date();
    
    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
      const date = new Date(year, month, i);
      const dayElement = createCalendarDay(i, false, isToday, date);
      DOM.calendarGrid.appendChild(dayElement);
    }
    
    // Dias do próximo mês
    const totalCells = 42;
    const daysSoFar = firstDayOfMonth + daysInMonth;
    const nextMonthDays = totalCells - daysSoFar;
    for (let i = 1; i <= nextMonthDays; i++) {
      const dayElement = createCalendarDay(i, true);
      DOM.calendarGrid.appendChild(dayElement);
    }
  }

// Cria um elemento de dia para o calendário
function createCalendarDay(day, isOtherMonth, isToday = false, fullDate = null) {
  const dayElement = document.createElement('div');
  dayElement.className = 'calendar-day';
  if (isOtherMonth) dayElement.classList.add('other-month');
  if (isToday) dayElement.classList.add('today');
  
  const dayHeader = document.createElement('div');
  dayHeader.className = 'calendar-day-number'; // Renomeado para melhor clareza
  dayHeader.textContent = day;
  dayElement.appendChild(dayHeader);
  
  if (fullDate) {
    const tasksForDay = state.routines.filter(task => {
      if (!task.date) return false;
      const taskDate = new Date(task.date);
      // Compara apenas Ano, Mês e Dia
      return (
        taskDate.getDate() === fullDate.getDate() &&
        taskDate.getMonth() === fullDate.getMonth() &&
        taskDate.getFullYear() === fullDate.getFullYear()
      );
    });

    tasksForDay.forEach(task => {
      const event = document.createElement('button');
      event.className = `calendar-event priority-${task.priority || 'medium'}`;
      event.textContent = task.title;
      event.addEventListener('click', () => openTaskDetails(task.id));
      dayElement.appendChild(event);
    });
  }

  return dayElement;
}


// === Configuração de Eventos e DRAG and DROP ===

function setupEventListeners() {
  if (DOM.btnToggleSidebar) DOM.btnToggleSidebar.addEventListener('click', toggleSidebar);
  // DOM.btnToggleTheme.addEventListener('click', toggleTheme); // Comentado pois o HTML não tem esse botão
  if (DOM.btnQuickAdd && DOM.modalQuickAdd) DOM.btnQuickAdd.addEventListener('click', () => {
    if (DOM.modalQuickAdd.showModal) DOM.modalQuickAdd.showModal();
    if (DOM.quickTitle) DOM.quickTitle.focus();
  });
  
  // Navegação principal (Hoje, Semana, etc.)
  if (DOM.menuLinks && DOM.menuLinks.length) {
    DOM.menuLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        setCurrentView(link.dataset.view);
      });
    });
  }

  // Filtros rápidos
  if (DOM.filterLinks && DOM.filterLinks.length) {
    DOM.filterLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const isActive = link.classList.contains('is-active');
        
        // Limpa a seleção de todos os filtros
        DOM.filterLinks.forEach(l => l.classList.remove('is-active'));
        
        // Ativa ou desativa o filtro clicado
        if (!isActive) {
          link.classList.add('is-active');
        }
        
        render(); // Re-renderiza com o novo filtro ativo
      });
    });
  }

  if (DOM.btnAddTag && DOM.modalAddTag) DOM.btnAddTag.addEventListener('click', () => { if (DOM.modalAddTag.showModal) DOM.modalAddTag.showModal(); });
  if (DOM.detailsClose) DOM.detailsClose.addEventListener('click', closeDetails);
  if (DOM.detailsForm) DOM.detailsForm.addEventListener('submit', saveTaskDetails);
  if (DOM.btnDeleteTask) DOM.btnDeleteTask.addEventListener('click', deleteCurrentTask);
  if (DOM.btnDuplicateTask) DOM.btnDuplicateTask.addEventListener('click', duplicateCurrentTask);
  
  // Adição Rápida
  if (DOM.quickAddForm) DOM.quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
      title: DOM.quickTitle.value.trim(),
      date: DOM.quickDate.value || undefined,
      priority: DOM.quickPriority.value || 'medium',
      tag: DOM.quickTag.value ? DOM.quickTag.value.replace('#', '') : undefined
    };
    if (formData.title) {
      addNewRoutine(formData);
      DOM.quickAddForm.reset();
      DOM.modalQuickAdd.close();
    } else {
        showToast('O título é obrigatório.', 'error');
    }
  });
  // ... (outros listeners de modal/calendário)
  
  if (DOM.quickAddForm && DOM.modalQuickAdd) {
    const cancelBtn = DOM.quickAddForm.querySelector('button[value="cancel"]');
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
      DOM.quickAddForm.reset();
      if (DOM.modalQuickAdd.close) DOM.modalQuickAdd.close();
    });
  }
  
  // Nova Etiqueta
  if (DOM.addTagForm) DOM.addTagForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
      name: DOM.tagName.value.trim(),
      color: DOM.tagColor.value
    };
    if (formData.name) {
      addNewTag(formData);
      DOM.addTagForm.reset();
      DOM.modalAddTag.close();
    } else {
        showToast('O nome da etiqueta é obrigatório.', 'error');
    }
  });
  if (DOM.addTagForm && DOM.modalAddTag) {
    const cancelTagBtn = DOM.addTagForm.querySelector('button[value="cancel"]');
    if (cancelTagBtn) cancelTagBtn.addEventListener('click', () => {
      DOM.addTagForm.reset();
      if (DOM.modalAddTag.close) DOM.modalAddTag.close();
    });
  }
  
  // Navegação do Calendário
  if (DOM.calPrev) DOM.calPrev.addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    renderCalendar();
  });
  if (DOM.calNext) DOM.calNext.addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    renderCalendar();
  });
  if (DOM.calToday) DOM.calToday.addEventListener('click', () => {
    state.currentDate = new Date();
    renderCalendar();
  });
  
  // Seleção de View Mode (Lista/Quadro/Calendário) - baseado no sidebar
  // Adicionado listener nos links do sidebar para mudar o viewmode quando clica
  document.querySelectorAll('.menu-link[data-view]').forEach(link => {
      link.addEventListener('click', (e) => {
          e.preventDefault();
          const view = link.dataset.view;
          setCurrentView(view);
          
          // Lógica simples para mudar o modo de visualização
          if (view === 'calendario') {
              setViewMode('calendario');
          } else if (view === 'hoje' || view === 'semana') {
              setViewMode('lista'); // Padrão
          }
      });
  });

  // Drag over global para permitir drop
  document.addEventListener('dragover', (e) => { e.preventDefault(); });
}

// Configuração do Drag and Drop (Kanban) - Adicionado lógica funcional
function setupDragAndDrop() {
    const columns = document.querySelectorAll('.column');
    
    // Configura o dragenter/dragleave para feedback visual
    columns.forEach(column => {
        column.addEventListener('dragenter', (e) => {
            e.preventDefault();
            column.classList.add('drag-over');
        });
        
        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });
        
        column.addEventListener('drop', handleDrop);
    });
}

// Lógica de drop
function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const taskId = e.dataTransfer.getData('text/plain');
    const newStatus = e.currentTarget.dataset.col;
    
    const task = state.routines.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        task.completed = newStatus === 'done'; // Marca como concluída se for para 'done'
        saveData();
        renderBoard(); // Re-renderiza o quadro
        showToast(`Rotina movida para: ${newStatus === 'todo' ? 'A fazer' : newStatus === 'doing' ? 'Em progresso' : 'Concluído'}`, 'info');
    }
}

// Alterna a sidebar
function toggleSidebar() {
  state.showSidebar = !state.showSidebar;
  DOM.app.setAttribute('data-layout', state.showSidebar ? 'with-sidebar' : 'without-sidebar');
  saveData();
}

// Alterna o tema claro/escuro (mantido como referência, embora o botão não esteja no HTML)
function toggleTheme() {
  const newTheme = state.preferences.theme === 'light' ? 'dark' : 'light';
  state.preferences.theme = newTheme;
  DOM.app.setAttribute('data-theme', newTheme);
  // DOM.btnToggleTheme.setAttribute('aria-pressed', newTheme === 'dark'); 
  saveData();
}

// Atualiza o relógio na topbar
function updateClock() {
  const now = new Date();
  DOM.todayDate.textContent = now.toLocaleDateString('pt-BR');
  DOM.nowTime.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Atualiza o título da view
function updateViewTitle() {
  const titles = {
    'hoje': 'Hoje',
    'todasRotinas': 'Todas as Rotinas',
    'calendario': 'Calendário'
  };
  // Tenta atualizar o título, mas como os elementos não existem, isso só evitará um erro.
  if (DOM.viewTitle) DOM.viewTitle.textContent = titles[state.currentView] || 'Rotinas';
  if (DOM.crumbView) DOM.crumbView.textContent = titles[state.currentView] || 'Rotinas';
}

// Renderiza o quadro Kanban
function renderBoard() {
  if (!DOM.todoList) return;
  DOM.todoList.innerHTML = '';
  DOM.doingList.innerHTML = '';
  DOM.doneList.innerHTML = '';
  
  // Obtém todas as tarefas, pois a filtragem é por status no Kanban
  let tasks = getFilteredTasks(); 
  
  tasks.forEach(task => {
    const card = createBoardCard(task);
    if (task.status === 'done') DOM.doneList.appendChild(card);
    else if (task.status === 'doing') DOM.doingList.appendChild(card);
    else DOM.todoList.appendChild(card);
  });
  
  document.getElementById('todoCount').textContent = `${DOM.todoList.children.length} itens`;
  document.getElementById('doingCount').textContent = `${DOM.doingList.children.length} itens`;
  document.getElementById('doneCount').textContent = `${DOM.doneList.children.length} itens`;
}


// Cria um elemento de tarefa para a lista
function createTaskElement(task) {
  const element = templates.taskItem.content.cloneNode(true);
  const li = element.querySelector('li');
  li.dataset.taskId = task.id;
  li.classList.toggle('is-completed', task.completed); // Adiciona classe para tarefas concluídas
  
  const checkbox = element.querySelector('.checkbox input');
  checkbox.checked = task.completed || false;
  checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
  
  element.querySelector('.task-title').textContent = task.title;
  
  const dueElement = element.querySelector('.due');
  if (task.date) {
    const dueDate = new Date(task.date);
    // Corrigido para garantir que a data exibida é a data correta
    dueElement.textContent = new Date(dueDate.getTime() + dueDate.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR'); 
    
    // Lógica de atraso (Overdue)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!task.completed && dueDate < today) dueElement.classList.add('overdue');
    else dueElement.classList.remove('overdue');
    
  } else {
    dueElement.textContent = 'Sem data';
  }
  
  const priorityElement = element.querySelector('.priority');
  // Remove classes existentes e adiciona a correta
  priorityElement.className = 'priority'; 
  priorityElement.textContent = task.priority === 'high' ? 'Alta' : task.priority === 'low' ? 'Baixa' : 'Média';
  priorityElement.classList.add(task.priority || 'medium');
  
  const tagElement = element.querySelector('.tag');
  if (task.tag) {
    tagElement.textContent = `#${task.tag}`;
    const tagInfo = state.tags.find(t => t.name === task.tag);
    if (tagInfo) {
      tagElement.style.backgroundColor = `${tagInfo.color}20`;
      tagElement.style.color = tagInfo.color;
    }
  } else {
    tagElement.textContent = '#geral';
  }
  
  element.querySelector('.task-open').addEventListener('click', () => openTaskDetails(task.id));
  
  li.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', task.id);
  });
  
  return element;
}

// Cria um card para o quadro Kanban
function createBoardCard(task) {
  const element = templates.boardCard.content.cloneNode(true);
  const card = element.querySelector('.card');
  card.dataset.taskId = task.id;
  card.draggable = true;
  card.classList.toggle('is-completed', task.completed);
  
  element.querySelector('.card-title').textContent = task.title;
  
  const dueElement = element.querySelector('.due');
  if (task.date) {
    const dueDate = new Date(task.date);
    dueElement.textContent = new Date(dueDate.getTime() + dueDate.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!task.completed && dueDate < today) dueElement.classList.add('overdue');
    else dueElement.classList.remove('overdue');
  } else {
    dueElement.textContent = 'Sem data';
  }
  
  const priorityElement = element.querySelector('.priority');
  priorityElement.className = 'priority'; // Limpa e adiciona
  priorityElement.textContent = task.priority === 'high' ? 'Alta' : task.priority === 'low' ? 'Baixa' : 'Média';
  priorityElement.classList.add(task.priority || 'medium');
  
  const tagElement = element.querySelector('.tag');
  if (task.tag) {
    tagElement.textContent = `#${task.tag}`;
    const tagInfo = state.tags.find(t => t.name === task.tag);
    if (tagInfo) {
      tagElement.style.backgroundColor = `${tagInfo.color}20`;
      tagElement.style.color = tagInfo.color;
    }
  } else {
    tagElement.textContent = '#geral';
  }
  
  const statusElement = element.querySelector('.status');
  if (task.status === 'done') statusElement.style.backgroundColor = '#10b981';
  else if (task.status === 'doing') statusElement.style.backgroundColor = '#f59e0b';
  else statusElement.style.backgroundColor = '#e5e7eb';
  
  element.querySelector('.card-actions button:first-child').addEventListener('click', () => openTaskDetails(task.id));
  element.querySelector('.card-actions button:last-child').textContent = task.completed ? 'Desfazer' : 'Concluir';
  element.querySelector('.card-actions button:last-child').addEventListener('click', () => toggleTaskCompletion(task.id));
  
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', task.id);
  });
  
  return element;
}


// Inicia a aplicação
init();
