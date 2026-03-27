# Inventory Management System (IMS)

A modern, responsive Inventory Management System built with React, Vite, and Tailwind CSS.

## 🚀 Prerequisites

Before you begin, ensure you have the following software installed on your system:

1.  **Node.js**: This is required to run the project. Download the **LTS (Long Term Support)** version from [nodejs.org](https://nodejs.org/).
    *   *Verify installation:* Open a terminal (Command Prompt/PowerShell) and run `node -v` and `npm -v`.
2.  **Git** (Optional): If you plan to clone the repository from GitHub. Download from [git-scm.com](https://git-scm.com/).
3.  **Visual Studio Code (VS Code)**: The recommended code editor. Download from [code.visualstudio.com](https://code.visualstudio.com/).

## 🛠️ Installation & Setup

1.  **Copy the Project**: Copy this entire project folder to your new system or clone it using Git.
2.  **Open in VS Code**: Right-click the folder and select "Open with Code", or open VS Code and use `File > Open Folder`.
3.  **Install Dependencies**:
    Open the terminal in VS Code (`Ctrl + ~` or `Terminal > New Terminal`) and run:
    ```bash
    npm install
    ```
    *This will download all the necessary libraries listed in `package.json` into a `node_modules` folder.*

4.  **Run the Application**:
    Start the development server by running:
    ```bash
    npm run dev
    ```
5.  **Access the App**:
    Hold `Ctrl` and click the URL shown in the terminal (usually `http://localhost:5173/`) to open it in your browser.

## 🧩 Recommended VS Code Extensions

For the best development experience, install these extensions in VS Code:

*   **ES7+ React/Redux/React-Native snippets**: Useful shortcuts for writing React code.
*   **Tailwind CSS IntelliSense**: Autocomplete and syntax highlighting for Tailwind classes.
*   **Prettier - Code formatter**: To keep your code strictly and consistently formatted.
*   **ESLint**: Catches common coding errors and patterns.

## 🔑 Default Login Credentials

The system comes with mock data and pre-defined users for testing:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@ims.com` | `admin` |
| **Staff Member** | `Rahul@staff.com` | `staff` |
| **Supplier** | `Hisham@supplier.com` | `supplier` |

## 🏗️ Building for Production

To create a production-ready build (optimized files for deployment):

```bash
npm run build
```
The output will be in the `dist` folder.

## 🔗 Run as MERN Stack (Frontend + Backend + MongoDB)

Your project now includes a backend in the sibling `backend` folder.

1. Start MongoDB locally (default local URI):
    ```
    mongodb://127.0.0.1:27017/
    ```

2. Start backend:
    ```bash
    cd ../backend
    npm install
    npm run dev
    ```

3. Start frontend in another terminal:
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

4. Frontend API base URL (already supported):
    - Create `.env` in `frontend` from `.env.example`
    - Default value: `VITE_API_BASE_URL=http://localhost:5000/api`

Backend health endpoint:
- `GET http://localhost:5000/api/health`
