# Dezvoltarea unei aplicații web de tip agregator pentru organizarea unui eveniment (Proiect de diplomă)

 Link către repository: [https://github.com/popescuadi15/Eventoria](https://github.com/popescuadi15/Eventoria)

## Cerințe prealabile

Înainte de a rula proiectul local, asigură‑te că ai instalate următoarele:

- **Node.js** (versiunea LTS recomandată, de ex. 18.x sau 20.x)  
- **npm** (se instalează împreună cu Node.js)  
- **Git** (pentru clonarea repository-ului)  
- **OpenSSL** (pentru decriptarea fișierului `.env.enc`)  
  - Pe Windows, poți folosi Git Bash (vine cu OpenSSL), sau instalează Win32/Win64 OpenSSL și adaugă-l în PATH.

---

## Cum rulezi aplicația local

> Aplicația folosește un fișier `.env` criptat pentru a proteja datele Firebase. 


### 1. Clonare repository

```bash
git clone https://github.com/popescuadi15/Eventoria.git
cd Proiect-Licenta
```


---

### 2. Instalează dependențele

```bash
npm install
```

### 3. Rulează aplicația

```bash
npm run dev
```

### 5. Accesează aplicația

După rularea comenzii de mai sus, deschide browser-ul și accesează:

```bash
http://localhost:5173
```

sau în terminal va apărea link-ul de mai sus http://localhost:5173, apăsațti ALT+click stânga și se va deschide browser-ul cu aplicația

## Notă de securitate

Fișierul `.env` conține date de conectare către Firebase și este criptat pentru a evita expunerea publică.

---

## Descărcare arhivă proiect

Dacă preferați să descărcați proiectul în format ZIP fără a folosi Git:

 [Click aici pentru descărcare .zip din GitHub](https://github.com/popescuadi15/Eventoria/archive/refs/heads/main.zip)


---

