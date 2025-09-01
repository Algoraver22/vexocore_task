import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showTasks, setShowTasks] = useState(false);

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    console.log('Attempting auth:', { email, isLogin, API_URL });
    
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }
    
    try {
      const endpoint = isLogin ? 'login' : 'register';
      const url = `${API_URL}/api/${endpoint}`;
      console.log('Making request to:', url);
      
      const res = await axios.post(url, { email, password });
      console.log('Auth success:', res.data);
      
      const newToken = res.data.token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Auth error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Authentication failed';
      alert(errorMsg);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/api/tasks`, { title: newTask }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks([...tasks, res.data]);
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (id, completed) => {
    try {
      const task = tasks.find(t => t.id === id);
      await axios.put(`${API_URL}/api/tasks/${id}`, { 
        title: task.title, 
        completed: !completed 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !completed } : t));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const startEdit = (id, title) => {
    setEditingId(id);
    setEditText(title);
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    try {
      const task = tasks.find(t => t.id === id);
      await axios.put(`${API_URL}/api/tasks/${id}`, { 
        title: editText, 
        completed: task.completed 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.map(t => t.id === id ? { ...t, title: editText } : t));
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setTasks([]);
  };

  if (!token) {
    return (
      <div className="auth-container">
        <h1>Task Manager</h1>
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
        </form>
        <p onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
        </p>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>Task Manager</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </header>
      
      <div className="app-layout">
        {/* Left Side - Add Task */}
        <div className="left-panel">
          <form onSubmit={addTask} className="add-task">
            <input
              type="text"
              placeholder="Add new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <button type="submit">Add Task</button>
          </form>
        </div>

        {/* Right Side - View Tasks */}
        <div className="right-panel">
          <div className="tasks-section">
            <button 
              onClick={() => setShowTasks(!showTasks)} 
              className="view-tasks-btn"
            >
              {showTasks ? 'Hide Tasks' : 'View Tasks'} ({tasks.length})
            </button>
            
            {showTasks && (
              <div className="tasks-container">
                {tasks.length === 0 ? (
                  <div className="no-tasks">No tasks yet!</div>
                ) : (
                  <div className="tasks-list">
                    {tasks.map(task => (
                      <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                        {editingId === task.id ? (
                          <div className="edit-mode">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && saveEdit(task.id)}
                              className="edit-input"
                              autoFocus
                            />
                            <div className="edit-actions">
                              <button onClick={() => saveEdit(task.id)} className="save-btn">Save</button>
                              <button onClick={cancelEdit} className="cancel-btn">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="task-content" onClick={() => toggleTask(task.id, task.completed)}>
                              <span className="task-text">{task.title}</span>
                              <span className="task-status">{task.completed ? '✓' : '○'}</span>
                            </div>
                            <div className="task-actions">
                              <button onClick={() => startEdit(task.id, task.title)} className="edit-btn">Edit</button>
                              <button onClick={() => deleteTask(task.id)} className="delete-btn">Delete</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;