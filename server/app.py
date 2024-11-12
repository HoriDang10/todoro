from flask import Flask, render_template, request, jsonify
import os

# Resolve the path to the templates folder
template_dir = os.path.abspath('../templates')

app = Flask(__name__, template_folder=template_dir)

tasks = []  # Store tasks in memory
task_stack = []  # Stack for undo functionality

@app.route('/')
def index():
    return render_template('todoro.html')

@app.route('/tasks', methods=['GET', 'POST', 'DELETE'])
def handle_tasks():
    if request.method == 'POST':
        task = request.json.get('task')
        if not task:
            return jsonify({'error': 'Task is required'}), 400
        tasks.append({'task': task, 'pomodoro': 0})  # Task with Pomodoro counter
        task_stack.append(('ADD', task))
        return jsonify(tasks), 201

    if request.method == 'DELETE':
        task_name = request.json.get('task')
        task = next((t for t in tasks if t['task'] == task_name), None)
        if task:
            tasks.remove(task)
            task_stack.append(('DELETE', task_name))
        return jsonify(tasks), 200

    return jsonify(tasks)

@app.route('/undo', methods=['POST'])
def undo_last_action():
    if not task_stack:
        return jsonify({'error': 'No actions to undo'}), 400

    last_action = task_stack.pop()
    action, task_name = last_action

    if action == 'ADD':
        tasks[:] = [t for t in tasks if t['task'] != task_name]
    elif action == 'DELETE':
        tasks.append({'task': task_name, 'pomodoro': 0})

    return jsonify(tasks), 200

@app.route('/pomodoro', methods=['POST'])
def pomodoro():
    task_name = request.json.get('task')
    task = next((t for t in tasks if t['task'] == task_name), None)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    task['pomodoro'] += 1  # Increment Pomodoro count
    return jsonify({'message': f'Pomodoro session completed for "{task_name}"!'}), 200

@app.route('/complete', methods=['POST'])
def complete_task():
    task = request.json.get('task')
    global tasks
    tasks = [t for t in tasks if t['task'] != task]
    return jsonify({'status': 'Task removed'}), 200

if __name__ == '__main__':
    app.run(debug=True)
