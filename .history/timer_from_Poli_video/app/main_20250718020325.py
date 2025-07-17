from flask import Flask, render_template
from datetime import datetime

app = Flask(__name__)

START_DATE = datetime(2025, 1, 15, 11, 0, 0)

@app.route('/')
def index():
    return render_template('index.html', start_date=START_DATE.isoformat())

if __name__ == '__main__':
    app.run(debug=True) 