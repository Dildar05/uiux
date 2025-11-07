// Desktop JavaScript for Student Portal

// Theme Toggle
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
  
  if (currentTheme === 'dark') {
    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
}

// Load saved theme
function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  updateTime();
  setInterval(updateTime, 60000); // Update every minute
});

// Update current time
function updateTime() {
  const timeElement = document.getElementById('current-time');
  if (timeElement) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeElement.textContent = `${hours}:${minutes}`;
  }
}

// Notification Functions
function markAllAsRead() {
  const notifications = document.querySelectorAll('.notification-unread');
  notifications.forEach(notification => {
    notification.classList.remove('notification-unread');
    notification.classList.add('notification-read');
  });
  
  // Update badge count
  const badge = document.querySelector('.notification-badge');
  if (badge) {
    badge.textContent = '0';
    badge.classList.add('hidden');
  }
  
  showToast('Все уведомления отмечены как прочитанные');
}

// Toast Notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white z-50 animate-slide-in ${
    type === 'success' ? 'bg-green-600' : 
    type === 'error' ? 'bg-red-600' : 
    type === 'warning' ? 'bg-orange-600' : 'bg-blue-600'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Filter Functions
function filterBySubject(subject) {
  const rows = document.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const subjectCell = row.querySelector('td:nth-child(2)');
    if (subject === 'all' || !subjectCell) {
      row.style.display = '';
    } else {
      row.style.display = subjectCell.textContent.includes(subject) ? '' : 'none';
    }
  });
}

function filterNotifications(category) {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  const notifications = document.querySelectorAll('.notification-item');
  notifications.forEach(notification => {
    if (category === 'all') {
      notification.style.display = '';
    } else {
      const hasCategory = notification.classList.contains(`notification-${category}`);
      notification.style.display = hasCategory ? '' : 'none';
    }
  });
}

// Modal Functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
    document.body.style.overflow = '';
  }
});

// Search Functionality
function initSearch() {
  const searchInput = document.querySelector('input[type="text"][placeholder*="Поиск"]');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      performSearch(searchTerm);
    });
  }
}

function performSearch(term) {
  // Search in current page content
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(term) ? '' : 'none';
  });
}

// Export Functions
function exportData(format) {
  showToast(`Экспорт данных в формате ${format}...`, 'info');
  
  // Simulate export
  setTimeout(() => {
    showToast(`Данные успешно экспортированы в ${format}`, 'success');
  }, 1500);
}

function downloadTranscript() {
  showToast('Подготовка транскрипта...', 'info');
  
  // Simulate download
  setTimeout(() => {
    showToast('Транскрипт успешно скачан', 'success');
  }, 1500);
}

// Calendar Functions
function selectDay(day) {
  // Remove active class from all days
  const days = document.querySelectorAll('.calendar-day');
  days.forEach(d => d.classList.remove('active'));
  
  // Add active class to selected day
  event.target.classList.add('active');
  
  // Load schedule for selected day
  loadScheduleForDay(day);
}

function loadScheduleForDay(day) {
  showToast(`Загрузка расписания на ${day} число...`, 'info');
  // Here you would typically fetch data from an API
}

// Statistics Update
function updateStatistics() {
  // Simulate real-time statistics update
  const stats = document.querySelectorAll('.stat-value');
  stats.forEach(stat => {
    stat.classList.add('animate-pulse');
    setTimeout(() => stat.classList.remove('animate-pulse'), 1000);
  });
}

// Auto-refresh data every 5 minutes
setInterval(() => {
  updateStatistics();
}, 300000);

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K for search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.querySelector('input[type="text"][placeholder*="Поиск"]');
    if (searchInput) {
      searchInput.focus();
    }
  }
  
  // Escape to close modals
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal-overlay:not(.hidden)');
    modals.forEach(modal => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  
  // Add smooth scroll to all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  
  // Add animation on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.card').forEach(card => {
    observer.observe(card);
  });
});

// Utility Functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Print function
function printPage() {
  window.print();
}

// Console greeting
console.log('%cStudent Portal 🎓', 'color: #22c55e; font-size: 24px; font-weight: bold;');
console.log('%cДобро пожаловать в систему!', 'color: #15803d; font-size: 14px;');
