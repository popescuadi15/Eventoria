# 🎉 Eventoria – Organizator Evenimente (Proiect de Licență)

Eventoria este o aplicație web dedicată organizării de evenimente, oferind un marketplace pentru furnizori și o interfață simplă pentru utilizatori care doresc să planifice evenimente într-un mod eficient.

## 📦 Tehnologii utilizate

- **Frontend:** React + Vite
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Autentificare:** Firebase Email/Password
- **Stocare imagini:** Firebase Storage
- **Formulare:** React Hook Form 
- **Stilizare:** Tailwind CSS

---

## 🚀 Cum rulezi aplicația local

> 🔐 Aplicația folosește un fișier `.env` criptat pentru a proteja datele Firebase. Urmează pașii de mai jos pentru a-l decripta și rula aplicația.

### 1. Clonare repository

```bash
git clone https://github.com/popescuadi15/Eventoria.git
cd Proiect-Licenta
```

### 2. Decriptează fișierul `.env`

#### 🔹 Varianta 1 (recomandată – Git Bash sau Linux/macOS)

Asigură-te că ai OpenSSL instalat. Apoi rulează:

```bash
openssl aes-256-cbc -d -in .env.enc -out .env
```

> 🔑 Parolă pentru decriptare: `licenta2025`

#### 🔹 Varianta 2 (Windows fără Git Bash)

Descarcă [OpenSSL pentru Windows](https://slproweb.com/products/Win32OpenSSL.html) și instalează-l cu opțiunea de a-l adăuga în `PATH`. Apoi deschide `cmd` sau `PowerShell` și rulează aceeași comandă de mai sus.

---

### 3. Instalează dependențele

```bash
npm install
```

### 4. Rulează aplicația

```bash
npm run dev
```

---

## 📝 Funcționalități cheie

- Înregistrare și autentificare utilizatori
- Căutare furnizori după categorie și oraș
- Adăugare și editare listări pentru furnizori
- Sistem de rezervare
- Gestionare evenimente planificate



---

## 🛡️ Notă de securitate

Fișierul `.env` conține date de conectare către Firebase și este criptat pentru a evita expunerea publică. Vă rugăm să nu publicați fișierul `.env` decriptat în mod neprotejat.

---

## 👨‍🏫 Evaluare

Acest proiect este destinat exclusiv evaluării academice și nu este configurat pentru producție. Toate datele Firebase sunt stocate într-un proiect de test.

---

## 👤 Autor

- **Popescu Florian-Adrian**
- Facultatea Automatică și Calculatoare
- Email: popescuadi05@gmail.com


