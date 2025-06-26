# 🛒 Walmart Clearance Optimizer

> 📦 An AI-powered inventory intelligence dashboard for retail chains like **Walmart** to track, analyze, and optimize clearance strategies by monitoring expiry, urgency, and stock health.

---

## 📽️ Watch Demo

[![Watch the demo](https://img.youtube.com/vi/YOUR_YOUTUBE_VIDEO_ID_HERE/0.jpg)](https://youtu.be/52S96wofr4o)

> ⏯️ Click to watch a live walkthrough of the platform.
> Delpoyed: http://inventory.darexai.com/ 
---

## 🖼️ Screenshots Preview

<img src="/public/screenshots/login.png" width="100%" />
<img src="/public/screenshots/homepng" width="100%" />
<img src="/public/screenshots/productsol.png" width="100%" />


> 📂 All screenshots are located in the `public/screenshots/` folder.

---

## 📌 Problem Statement

Large-scale retailers often struggle to manage **perishable inventory**, leading to:
- 🗑️ Product wastage
- 💸 Revenue loss
- 🤯 Missed clearance opportunities

Manual methods are inefficient and error-prone, especially at scale.

---

## ✅ Solution

**Walmart Clearance Optimizer** solves this by offering:
- 🎯 Real-time **product tracking** based on expiry & stock
- 📊 **Visual dashboards** for urgency & category analysis
- 🔐 **Role-based access** (Admin, Manager, Staff)
- 📥 CSV downloads and advanced filters
- 💡 Smart recommendations (coming soon!)

---

## 🚀 Features

- ✅ Add / edit / delete product entries
- 🕒 Expiry & manufacture date tracking
- 🧯 Detects:
  - Expired items
  - Expiring soon
  - Low-stock alerts
- 📊 Dashboard with:
  - Total inventory value
  - Category-wise breakdown
  - Expiry insights
- 🔐 Login with 3 roles (RBAC)
- 📎 Export product list to CSV

---

## ⚙️ Tech Stack

| Layer      | Technology                        |
|------------|------------------------------------|
| Frontend   | React.js, Tailwind CSS, Recharts   |
| Backend    | Python Flask, JWT, REST APIs       |
| Database   | MongoDB Atlas                      |
| Dev Tools  | Vite, Postman, GitHub, dotenv      |

---

## 🧑‍🤝‍🧑 Team Members

| Name           | Role                 |
|----------------|----------------------|
| **Lincy B.**   | Frontend Developer   |
| **Aditya (Addy)** | Backend Developer |

---

## 📁 Project Structure

```
walmart-clearance-optimizer/
├── backend/
│ ├── models/
│ ├── routes/
│ ├── app.py
│ └── .env
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ └── App.jsx
│ └── public/
│ └── screenshots/
├── README.md
└── .gitignore
```

---

## 🔑 Environment Variables

Create a `.env` file in the `model/` directory:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/walmartDB
JWT_SECRET=your_jwt_secret_key
🛠️ How to Run Locally
▶️ Backend (Flask API)
bash
Copy
Edit
cd backend
pip install -r requirements.txt
python app.py
💻 Frontend (React + Tailwind)
bash
Copy
Edit
cd frontend
npm install
npm run dev
🧠 Future Scope
🤖 AI-based markdown recommendation

📧 Email alerts for urgent stock

🛒 Customer-side product suggestions

📈 ML-powered sales forecasting

📃 License
This project is licensed under the MIT License.

🙏 Acknowledgements
Special thanks to Walmart and the hackathon organizers for providing this opportunity. Our solution contributes toward reducing retail waste and maximizing clearance efficiency.

💡 Made with ❤️ by Lincy & Addy (Aditya Kumar)

yaml
Copy
Edit

---

### ✅ What's Next?
Would you like:
- A `live demo` badge to show status?
- Add a `Deploy to PythonAnywhere` or `Render` button?
- A `README.gif` walkthrough animation instead of screenshots?

Let me know and I’ll help instantly!