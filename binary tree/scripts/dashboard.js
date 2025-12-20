/**
 * Dashboard Page
 * Displays user profile, statistics, and history
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Anonymous-friendly dashboard: no redirects, show guest data
  let user = null;
  try {
    if (typeof auth !== 'undefined' && auth.getCurrentUser) {
      user = await auth.getCurrentUser();
    }
  } catch (_) {}

  // Load and display profile (falls back to guest)
  displayProfile(user);

  // Load and display statistics
  await displayStatistics();

  // Load and display history
  await displayHistory();
});

function displayProfile(user) {
  const profileDiv = document.getElementById('profile-info');
  if (!profileDiv) return;

  const isGuest = !user;
  const createdAt = user && user.createdAt ? new Date(user.createdAt) : new Date();
  const lastLogin = user && user.lastLogin ? new Date(user.lastLogin) : null;
  const name = isGuest ? 'Guest' : escapeHtml(user.name);
  const email = isGuest ? '—' : escapeHtml(user.email);

  profileDiv.innerHTML = `
    <div class="profile-item">
      <div class="label">Name</div>
      <div class="value">${name}</div>
    </div>
    <div class="profile-item">
      <div class="label">Email</div>
      <div class="value">${email}</div>
    </div>
    <div class="profile-item">
      <div class="label">Member Since</div>
      <div class="value">${createdAt.toLocaleDateString()}</div>
    </div>
    ${lastLogin ? `
    <div class="profile-item">
      <div class="label">Last Login</div>
      <div class="value">${lastLogin.toLocaleDateString()}</div>
    </div>
    ` : ''}
  `;
}

async function displayStatistics() {
  const statsDiv = document.getElementById('activity-stats');
  if (!statsDiv) return;

  try {
    const stats = await auth.getUserStats();
    
    if (!stats) {
      statsDiv.innerHTML = '<p>Loading statistics...</p>';
      return;
    }

    statsDiv.innerHTML = `
      <div class="stat-card">
        <div class="icon">📊</div>
        <div class="number">${stats.totalOperations || 0}</div>
        <div class="label">Total Operations</div>
      </div>
      <div class="stat-card">
        <div class="icon">🔢</div>
        <div class="number">${stats.uniqueAlgorithms || 0}</div>
        <div class="label">Algorithms Used</div>
      </div>
      <div class="stat-card">
        <div class="icon">📅</div>
        <div class="number">${stats.todayOperations || 0}</div>
        <div class="label">Today's Activity</div>
      </div>
      <div class="stat-card">
        <div class="icon">⭐</div>
        <div class="number">${Math.floor((stats.totalOperations || 0) / 10)}</div>
        <div class="label">Level</div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading statistics:', error);
    statsDiv.innerHTML = '<p>Error loading statistics</p>';
  }
}

async function displayHistory() {
  const historyDiv = document.getElementById('history-list');
  if (!historyDiv) return;

  try {
    const history = await auth.getUserHistory(50);

    if (history.length === 0) {
      historyDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📜</div>
          <h3>No History Yet</h3>
          <p>Start using algorithms to see your activity here!</p>
        </div>
      `;
      return;
    }

    historyDiv.innerHTML = history.map(entry => {
      const date = new Date(entry.timestamp);
      const timeAgo = getTimeAgo(date);
      const typeLabel = getTypeLabel(entry.type);
      const dataPreview = getDataPreview(entry.data);

      return `
        <div class="history-item" data-id="${entry._id || entry.id}">
          <div class="history-item-header">
            <div class="history-item-title">
              <span class="history-item-type ${entry.type}">${typeLabel}</span>
              ${entry.data?.algorithm || entry.data?.type || 'Operation'}
            </div>
            <div class="history-item-time">${timeAgo}</div>
          </div>
          <div class="history-item-details">
            ${getHistoryDetails(entry)}
          </div>
          ${dataPreview ? `
          <div class="history-item-data">
            ${dataPreview}
          </div>
          ` : ''}
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading history:', error);
    historyDiv.innerHTML = '<p>Error loading history</p>';
  }
}

function getTypeLabel(type) {
  const labels = {
    'sort': 'Sort',
    'search': 'Search',
    'tree': 'Tree',
    'graph': 'Graph',
    'challenge': 'Challenge',
    'playground': 'Code'
  };
  return labels[type] || type;
}

function getHistoryDetails(entry) {
  const data = entry.data || {};
  
  if (entry.type === 'sort') {
    return `Sorted ${data.arrayLength || 0} elements using ${data.algorithm || 'algorithm'}`;
  } else if (entry.type === 'search') {
    return `Searched for ${data.target || 'value'} in array of ${data.arrayLength || 0} elements`;
  } else if (entry.type === 'tree') {
    return `Tree operation: ${data.operation || 'action'} on ${data.treeType || 'tree'}`;
  } else if (entry.type === 'graph') {
    return `Graph algorithm: ${data.algorithm || 'operation'}`;
  } else if (entry.type === 'challenge') {
    return `Challenge: ${data.challengeType || 'puzzle'}`;
  } else if (entry.type === 'playground') {
    return `Code execution: ${data.language || 'JavaScript'}`;
  }
  
  return 'Algorithm operation';
}

function getDataPreview(data) {
  if (!data) return null;
  
  if (data.input) {
    return `Input: ${JSON.stringify(data.input).substring(0, 100)}${JSON.stringify(data.input).length > 100 ? '...' : ''}`;
  } else if (data.array) {
    return `Array: [${data.array.slice(0, 10).join(', ')}${data.array.length > 10 ? '...' : ''}]`;
  } else if (data.values) {
    return `Values: ${data.values.substring(0, 100)}${data.values.length > 100 ? '...' : ''}`;
  }
  
  return null;
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

