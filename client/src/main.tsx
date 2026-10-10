import "./index.css";
import App from "./App"; // Removed explicit extension and fixed formatting
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AppProvider } from "./context/AppContext.tsx";

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <ThemeProvider>
            <AppProvider>
              <App /> 
            </AppProvider>
        </ThemeProvider>
    </BrowserRouter>
);