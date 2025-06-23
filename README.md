
# 🛒 Walmart Clearance Optimizer

A smart inventory dashboard to help retailers like Walmart track product expiry, stock levels, and clearance priorities using visual urgency scores, analytics, and role-based access control.

---

## 📌 Problem Statement

Retailers often face challenges in managing perishable inventory. Products nearing their expiry date may go unnoticed, leading to **stock wastage**, **revenue loss**, and **missed clearance opportunities**. Manual tracking in large-scale operations is inefficient and prone to errors.

---

## ✅ Solution

**Walmart Clearance Optimizer** is a full-stack inventory monitoring system that:

- Detects **urgent**, **expiring soon**, and **low-stock** items.
- Provides a **dashboard** to monitor stock analytics.
- Allows **CSV download**, **smart filtering**, and **sorting**.
- Supports **Admin**, **Manager**, and **Staff** login roles with different capabilities.
- Visualizes data with **bar charts** and **urgency levels**.
- Makes use of **manufacture and expiry dates** to calculate urgency.

---

## 🧑‍🤝‍🧑 Team Members

| Name              | Role                             |
|-------------------|----------------------------------|
| **Lincy Bainiwal** | Frontend Developer              |
| **Addy**           | Backend Developer               |

---

## 🚀 Features

- 📋 Add, edit, delete product entries
- 📅 Handles expiry and manufacture dates
- 📉 Highlights products that are:
  - Expired
  - Expiring soon
  - Low on stock
- 📊 Dashboard with:
  - Total stock value
  - Expiry statistics
  - Category-wise analytics
- 🔐 Role-based login (Admin, Manager, Staff)
- 📥 Download CSV of all products

---

## ⚙️ Tech Stack

| Layer      | Technology                     |
|------------|---------------------------------|
| Frontend   | React.js, Tailwind CSS, Recharts |
| Backend    | Python Flask (Addy’s part)       |
| Database   | MongoDB Atlas                    |
| Auth/API   | JWT, REST APIs, Axios            |

---

## 📁 Folder Structure


```
walmart-clearance-optimizer/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── app.py
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── assets/
│   │   └── App.jsx
├── README.md
├── .gitignore
```


---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory:

```

MONGO\_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/walmartDB
JWT\_SECRET=your\_jwt\_secret\_key

````

---

## 🛠️ How to Run Locally

### Backend (Flask)

```bash
cd backend
pip install -r requirements.txt
python app.py
````

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

---

## 🧠 Future Scope

* AI-based dynamic discounting
* Automated email alerts for urgent stock
* Role-based product access
* Sales forecasting with ML

---

## 📃 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

We thank Walmart and the hackathon organizers for the opportunity to build a socially impactful project. Our tool helps reduce waste and improve clearance strategy.

---

> Built  by Lincy and Addy

```

---

Let me know if you'd like:
- `.env.example`
- Flask `app.py` boilerplate
- A GitHub badge section  
I'll be happy to help!
```

