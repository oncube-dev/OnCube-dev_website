from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для локальной разработки

SECRET_PASSWORD = 'PS'

@app.route('/check_password', methods=['POST'])
def check_password():
    data = request.get_json()
    password = data.get('password', '')
    if password == SECRET_PASSWORD:
        return jsonify({'success': True})
    else:
        return jsonify({'success': False}), 401

if __name__ == '__main__':
    app.run(debug=True, port=5000) 