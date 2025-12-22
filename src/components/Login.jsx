import React, { useMemo, useState } from "react"
import styled from "styled-components"
import { useNavigate } from "react-router-dom"
import logoLogin from "../assets/logo-login.jpg"

export default function Login() {
  const navigate = useNavigate()

  /**
   * API_BASE blindado:
   * - Dev  → localhost
   * - Prod → Render (aunque Vercel no inyecte env)
   * - Soporta VITE_API_URL con o sin /api
   */
  const API_BASE = useMemo(() => {
    const isProd = import.meta.env.MODE === "production"

    const fallback = isProd
      ? "https://fideliza-plus.onrender.com"
      : "http://localhost:4000"

    const raw = (import.meta?.env?.VITE_API_URL || fallback).replace(/\/$/, "")
    return raw.endsWith("/api") ? raw : `${raw}/api`
  }, [])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.message || "No se pudo iniciar sesión")
        setLoading(false)
        return
      }

      // ✅ AHORA: sesión solo por pestaña (sessionStorage)
      sessionStorage.setItem("token", data.token)
      sessionStorage.setItem("user", JSON.stringify(data.user || {}))

      // (por si antes quedaba algo viejo)
      localStorage.removeItem("token")
      localStorage.removeItem("user")

      // avisa al App.jsx que cambió la sesión
      window.dispatchEvent(new Event("auth-changed"))

      navigate("/dashboard", { replace: true })
    } catch (err) {
      setErrorMsg("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <ImageSide>
        <img src={logoLogin} alt="Fideliza+ Login" />
      </ImageSide>

      <LoginSide>
        <StyledWrapper>
          <div className="container">
            <div className="login-box">
              <h2>Login</h2>

              <form onSubmit={handleSubmit}>
                <div className="input-box">
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=" "
                    autoComplete="email"
                    disabled={loading}
                  />
                  <label>Email</label>
                </div>

                <div className="input-box">
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=" "
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <label>Password</label>
                </div>

                {!!errorMsg && <div className="error-msg">{errorMsg}</div>}

                <button className="btn" type="submit" disabled={loading}>
                  {loading ? "Entrando..." : "Login"}
                </button>
              </form>
            </div>

            {Array.from({ length: 50 }).map((_, i) => (
              <span key={i} style={{ "--i": i }} />
            ))}
          </div>
        </StyledWrapper>
      </LoginSide>
    </PageWrapper>
  )
}

/* ===== LAYOUT (SIN CAMBIOS) ===== */

const PageWrapper = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #1f293a;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const ImageSide = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 900px) {
    display: none;
  }
`

const LoginSide = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1f293a;
`

/* ===== DISEÑO ORIGINAL INTACTO ===== */

const StyledWrapper = styled.div`
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;

  .container {
    position: relative;
    width: 400px;
    height: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    overflow: hidden;
    background: #1f293a;
  }

  .container span {
    position: absolute;
    left: 0;
    width: 32px;
    height: 6px;
    background: #2c4766;
    border-radius: 80px;
    transform-origin: 200px;
    transform: rotate(calc(var(--i) * (360deg / 50)));
    animation: blink 3s linear infinite;
    animation-delay: calc(var(--i) * (3s / 50));
  }

  @keyframes blink {
    0% {
      background: #0ef;
    }
    25% {
      background: #2c4766;
    }
  }

  .login-box {
    position: absolute;
    width: 80%;
    max-width: 300px;
    z-index: 1;
    padding: 20px;
    border-radius: 20px;
  }

  h2 {
    font-size: 1.8em;
    color: #0ef;
    text-align: center;
    margin-bottom: 10px;
  }

  .input-box {
    position: relative;
    margin: 15px 0;
  }

  input {
    width: 100%;
    height: 45px;
    background: transparent;
    border: 2px solid #2c4766;
    outline: none;
    border-radius: 40px;
    font-size: 1em;
    color: #fff;
    padding: 0 15px;
  }

  input:focus {
    border-color: #0ef;
  }

  input::placeholder {
    color: transparent;
  }

  input:focus ~ label,
  input:not(:placeholder-shown) ~ label {
    top: -10px;
    font-size: 0.8em;
    background: #1f293a;
    padding: 0 6px;
    color: #0ef;
  }

  label {
    position: absolute;
    top: 50%;
    left: 15px;
    transform: translateY(-50%);
    font-size: 1em;
    color: #fff;
    pointer-events: none;
    transition: 0.5s;
  }

  .error-msg {
    margin: 8px 0 4px;
    font-size: 0.9em;
    color: #ff6b6b;
    text-align: center;
    font-weight: 600;
  }

  .btn {
    width: 100%;
    height: 45px;
    background: #0ef;
    border: none;
    border-radius: 40px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    color: #1f293a;
  }

  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.75;
  }

  a {
    color: #0ef;
    text-decoration: none;
    font-weight: 600;
  }
`
