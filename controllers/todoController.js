const db = require('../db/db');

const path = require('path');

const todoController = {
    // Exibir a página de todo list
    async showTodoPage(req, res) {
        res.sendFile(path.join(__dirname, '../todo_th/todo.html'));
    },

    // Obter todas as tarefas
    async getTodos(req, res) {
        try {
            const [rows] = await db.mysqlPool.query('SELECT * FROM todos ORDER BY created_at DESC');
            res.json(rows);
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    // Adicionar uma nova tarefa
    async addTodo(req, res) {
        const { text, dia_semana, observacao } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Texto da tarefa é obrigatório' });
        }

        try {
            const [result] = await db.mysqlPool.query(
                'INSERT INTO todos (text, dia_semana, observacao) VALUES (?, ?, ?)',
                [text, dia_semana || null, observacao || null]
            );

            const [newTodo] = await db.mysqlPool.query(
                'SELECT * FROM todos WHERE id = ?',
                [result.insertId]
            );

            res.status(201).json(newTodo[0]);
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    // Marcar uma tarefa como concluída
    async completeTodo(req, res) {
        const { id } = req.params;

        try {
            const [existingTodo] = await db.mysqlPool.query(
                'SELECT * FROM todos WHERE id = ?',
                [id]
            );

            if (existingTodo.length === 0) {
                return res.status(404).json({ error: 'Tarefa não encontrada' });
            }

            const completed = !existingTodo[0].completed;
            await db.mysqlPool.query(
                'UPDATE todos SET completed = ? WHERE id = ?',
                [completed, id]
            );

            res.json({ id, completed });
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    // Excluir uma tarefa
    async deleteTodo(req, res) {
        const { id } = req.params;

        try {
            const [result] = await db.mysqlPool.query(
                'DELETE FROM todos WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Tarefa não encontrada' });
            }

            res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
};

module.exports = todoController;