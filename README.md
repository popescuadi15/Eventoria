# Dezvoltarea unei aplicații web de tip agregator pentru organizarea unui eveniment (Proiect de diplomă)

Eventoria este o aplicație web dedicată organizării de evenimente, oferind un marketplace pentru furnizori și o interfață simplă pentru utilizatori care doresc să planifice evenimente într-un mod eficient.

## Cerințe prealabile

Înainte de a rula proiectul local, asigură‑te că ai instalate următoarele:

- **Node.js** (versiunea LTS recomandată, de ex. 18.x sau 20.x)  
- **npm** (se instalează împreună cu Node.js)  
- **Git** (pentru clonarea repository-ului)  
- **OpenSSL** (pentru decriptarea fișierului `.env.enc`)  
  - Pe Windows, poți folosi Git Bash (vine cu OpenSSL), sau instalează Win32/Win64 OpenSSL și adaugă-l în PATH.

---

## Cum rulezi aplicația local

> Aplicația folosește un fișier `.env` criptat pentru a proteja datele Firebase. Urmează pașii de mai jos pentru a-l decripta și rula aplicația.

📎 Link către repository: [https://github.com/popescuadi15/Eventoria](https://github.com/popescuadi15/Eventoria)

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

## Notă de securitate

Fișierul `.env` conține date de conectare către Firebase și este criptat pentru a evita expunerea publică. Vă rugăm să nu publicați fișierul `.env` decriptat în mod neprotejat.

---

## Descărcare arhivă proiect

Dacă preferați să descărcați proiectul în format ZIP fără a folosi Git:

👉 [Click aici pentru descărcare .zip din GitHub](https://github.com/popescuadi15/Eventoria/archive/refs/heads/main.zip)

După ce extrageți arhiva:
1. Deschideți folderul rezultat
2. Urmați pașii de decriptare `.env` și rulare locală de mai sus

---

