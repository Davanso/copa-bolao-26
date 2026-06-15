import { render, screen } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GuessScoreFields, type GuessScoreDraft } from "../GuessScoreFields";

describe("GuessScoreFields", () => {
  it("normaliza valores digitados e aciona salvar", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    function Wrapper() {
      const [draft, setDraft] = useState<GuessScoreDraft>({
        away: "",
        home: "",
      });

      return (
        <>
          <GuessScoreFields
            awayLabel="Mexico"
            buttonLabel="Salvar"
            draft={draft}
            homeLabel="Brasil"
            onChange={setDraft}
            onSave={onSave}
          />
          <output aria-label="draft-home">{draft.home}</output>
        </>
      );
    }

    render(<Wrapper />);

    await user.type(screen.getByLabelText("Brasil"), "a12");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByLabelText("draft-home").textContent).toBe("12");
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
