from flask import Flask, request, jsonify
from flask_cors import CORS  

app = Flask(__name__)
CORS(app)  

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "")
    print("User said:", user_message)

    # For now, always reply with "OKAY"
    return jsonify({"reply": "OKAY"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
