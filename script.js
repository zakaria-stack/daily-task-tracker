// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = '';
        this.currentSort = 'newest';
        this.editingTaskId = null;
        
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.updateClock();
        this.updateStatistics();
        this.renderTasks();
        this.setupTheme();
        
        // Update clock every second
        setInterval(() => this.updateClock(), 1000);
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Add task
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilter = e.target.value.toLowerCase();
            this.renderTasks();
        });

        // Sort
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderTasks();
        });

        // Quick actions
        document.getElementById('markAllCompletedBtn').addEventListener('click', () => this.markAllAs('completed'));
        document.getElementById('markAllPendingBtn').addEventListener('click', () => this.markAllAs('pending'));
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAllTasks());

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Format timestamp
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}:${month}:${day}:${hours}:${minutes}:${seconds}`;
    }

    // Update live clock
    updateClock() {
        const now = new Date();
        const clockElement = document.getElementById('clock');
        clockElement.textContent = this.formatTimestamp(now);
    }

    // Add new task
    addTask() {
        const taskInput = document.getElementById('taskInput');
        const taskText = taskInput.value.trim();
        
        if (!taskText) {
            this.showToast('يرجى إدخال نص المهمة', 'error');
            return;
        }

        const task = {
            id: this.generateId(),
            text: taskText,
            completed: false,
            timestamp: Date.now()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStatistics();
        
        taskInput.value = '';
        this.showToast('تم إضافة المهمة بنجاح', 'success');
    }

    // Toggle task completion
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStatistics();
            
            const status = task.completed ? 'تم إنجاز المهمة' : 'تم إلغاء إنجاز المهمة';
            this.showToast(status, 'info');
        }
    }

    // Delete task
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.classList.add('removing');
                setTimeout(() => {
                    this.tasks.splice(taskIndex, 1);
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStatistics();
                    this.showToast('تم حذف المهمة', 'success');
                }, 300);
            }
        }
    }

    // Edit task
    editTask(taskId) {
        if (this.editingTaskId && this.editingTaskId !== taskId) {
            this.cancelEdit();
        }

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.editingTaskId = taskId;
        const taskElement = document.querySelector(`[data-task-id="${taskId}"] .task-text`);
        const originalText = task.text;
        
        taskElement.classList.add('editable');
        taskElement.contentEditable = true;
        taskElement.focus();
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(taskElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        const saveEdit = () => {
            const newText = taskElement.textContent.trim();
            if (newText && newText !== originalText) {
                task.text = newText;
                this.saveTasks();
                this.showToast('تم تحديث المهمة', 'success');
            }
            this.cancelEdit();
        };

        const cancelEdit = () => {
            taskElement.textContent = originalText;
            this.cancelEdit();
        };

        // Event handlers for editing
        taskElement.addEventListener('blur', saveEdit, { once: true });
        taskElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
        }, { once: true });
        taskElement.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cancelEdit();
            }
        }, { once: true });
    }

    // Cancel edit mode
    cancelEdit() {
        if (this.editingTaskId) {
            const taskElement = document.querySelector(`[data-task-id="${this.editingTaskId}"] .task-text`);
            if (taskElement) {
                taskElement.classList.remove('editable');
                taskElement.contentEditable = false;
            }
            this.editingTaskId = null;
        }
    }

    // Mark all tasks with specific status
    markAllAs(status) {
        const completed = status === 'completed';
        let changedCount = 0;
        
        this.tasks.forEach(task => {
            if (task.completed !== completed) {
                task.completed = completed;
                changedCount++;
            }
        });

        if (changedCount > 0) {
            this.saveTasks();
            this.renderTasks();
            this.updateStatistics();
            
            const message = completed ? 
                `تم تمييز ${changedCount} مهمة كمُنجزة` : 
                `تم تمييز ${changedCount} مهمة كغير مُنجزة`;
            this.showToast(message, 'success');
        } else {
            this.showToast('لا توجد مهام للتحديث', 'info');
        }
    }

    // Clear all tasks
    clearAllTasks() {
        if (this.tasks.length === 0) {
            this.showToast('لا توجد مهام للحذف', 'info');
            return;
        }

        const confirmed = confirm(`هل أنت متأكد من حذف جميع المهام (${this.tasks.length})?`);
        if (confirmed) {
            this.tasks = [];
            this.saveTasks();
            this.renderTasks();
            this.updateStatistics();
            this.showToast('تم حذف جميع المهام', 'success');
        }
    }

    // Filter tasks based on search
    filterTasks() {
        if (!this.currentFilter) return this.tasks;
        
        return this.tasks.filter(task => 
            task.text.toLowerCase().includes(this.currentFilter)
        );
    }

    // Sort tasks
    sortTasks(tasks) {
        const sortedTasks = [...tasks];
        
        switch (this.currentSort) {
            case 'newest':
                return sortedTasks.sort((a, b) => b.timestamp - a.timestamp);
            case 'oldest':
                return sortedTasks.sort((a, b) => a.timestamp - b.timestamp);
            case 'completed':
                return sortedTasks.sort((a, b) => b.completed - a.completed);
            case 'pending':
                return sortedTasks.sort((a, b) => a.completed - b.completed);
            default:
                return sortedTasks;
        }
    }

    // Render tasks
    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const noTasksMessage = document.getElementById('noTasksMessage');
        
        let filteredTasks = this.filterTasks();
        filteredTasks = this.sortTasks(filteredTasks);
        
        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '';
            noTasksMessage.style.display = 'block';
            
            if (this.currentFilter) {
                noTasksMessage.querySelector('p').textContent = 'لا توجد مهام تطابق البحث';
            } else {
                noTasksMessage.querySelector('p').textContent = 'لا توجد مهام حالياً';
            }
        } else {
            noTasksMessage.style.display = 'none';
            
            tasksList.innerHTML = filteredTasks.map(task => `
                <div class="task-item ${task.completed ? 'completed' : 'pending'}" data-task-id="${task.id}">
                    <div class="task-header">
                        <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                        <div class="task-actions">
                            <button class="task-btn toggle" onclick="taskManager.toggleTask('${task.id}')" title="${task.completed ? 'إلغاء الإنجاز' : 'تمييز كمُنجز'}">
                                <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                            </button>
                            <button class="task-btn edit" onclick="taskManager.editTask('${task.id}')" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="task-btn delete" onclick="taskManager.deleteTask('${task.id}')" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="task-meta">
                        <span class="task-timestamp">${this.formatTimestamp(task.timestamp)}</span>
                        <span class="task-status ${task.completed ? 'completed' : 'pending'}">
                            ${task.completed ? 'مُنجز' : 'معلق'}
                        </span>
                    </div>
                </div>
            `).join('');
        }
    }

    // Update statistics
    updateStatistics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        
        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Theme management
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');
        
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    // Local storage management
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('tasks');
        if (saved) {
            try {
                this.tasks = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading tasks:', e);
                this.tasks = [];
            }
        }
    }

    // Export tasks (bonus feature)
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `tasks_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Import tasks (bonus feature)
    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    this.tasks = importedTasks;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStatistics();
                    this.showToast('تم استيراد المهام بنجاح', 'success');
                } else {
                    this.showToast('تنسيق الملف غير صحيح', 'error');
                }
            } catch (error) {
                this.showToast('خطأ في قراءة الملف', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Get tasks statistics
    getStatistics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
            total,
            completed,
            pending,
            completionRate
        };
    }
}

// Initialize the application
let taskManager;

document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+N or Cmd+N for new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('taskInput').focus();
    }
    
    // Ctrl+F or Cmd+F for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Ctrl+Shift+D or Cmd+Shift+D for dark theme toggle
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        taskManager.toggleTheme();
    }
});

// Handle page visibility change to update clock
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        taskManager.updateClock();
    }
});

// Export taskManager for global access
window.taskManager = taskManager;
