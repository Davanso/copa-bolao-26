import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@mui/material/styles";
import { LoginPage } from "../LoginPage";
import { api } from "../../services/api";
import { theme } from "../../styles/theme";

const loginMock = vi.fn();
const navigateMock = vi.fn();
const showToastMock = vi.fn();

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ login: loginMock }),
}));

vi.mock("../../hooks/useToast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function renderLogin(initialPath = "/login") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, "post").mockResolvedValue({
      data: {
        token: "token",
        user: { id: "1", role: "user", username: "davi" },
      },
    });
  });

  it("alterna para criação de conta e preenche campos", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(navigateMock).toHaveBeenCalledWith("/login?mode=register");
  });

  it("envia login feliz com username e senha", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(
      screen.getByRole("textbox", { name: /e-mail ou username/i }),
      "davi",
    );
    await user.type(screen.getByLabelText(/senha/i), "123456");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        identifier: "davi",
        password: "123456",
      });
    });
    expect(loginMock).toHaveBeenCalledWith("token", {
      id: "1",
      role: "user",
      username: "davi",
    });
    expect(showToastMock).toHaveBeenCalledWith(
      "Login realizado com sucesso!",
      "success",
    );
  });
});
