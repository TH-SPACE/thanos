const express = require('express');
const router = express.Router();

// Importar o controller de todo
const todoController = require('../controllers/todoController');

// Rota para exibir a página de todo list
router.get('/', todoController.showTodoPage);

// Rota para obter tarefas em formato JSON
router.get('/api/todos', todoController.getTodos);

// Rota para adicionar uma nova tarefa
router.post('/add', todoController.addTodo);

// Rota para marcar uma tarefa como concluída
router.put('/complete/:id', todoController.completeTodo);

// Rota para excluir uma tarefa
router.delete('/delete/:id', todoController.deleteTodo);

module.exports = router;