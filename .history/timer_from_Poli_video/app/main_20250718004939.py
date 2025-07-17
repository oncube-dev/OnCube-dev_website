from flask import Flask, render_template
from datetime import datetime

app = Flask(__name__)

# Укажите дату старта таймера (например, 2024-07-01 00:00:00)
START_DATE = datetime(2024, 7, 1, 0, 0, 0)

@app.route('/')
def index():
    # Передаём стартовую дату в шаблон в формате ISO
    return render_template('index.html', start_date=START_DATE.isoformat())

if __name__ == '__main__':
    app.run(debug=True) 