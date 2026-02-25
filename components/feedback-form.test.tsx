import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FeedbackForm } from "./feedback-form";

const sendFeedbackEmailMock = vi.fn();

vi.mock("@/lib/send-feedback-email", () => ({
  sendFeedbackEmail: (...args: unknown[]) => sendFeedbackEmailMock(...args),
}));

beforeEach(() => {
  sendFeedbackEmailMock.mockReset();
});

describe("FeedbackForm", () => {
  it("renders email and message fields", () => {
    render(
      <FeedbackForm
        title="Anna palautetta"
        description="Kerro ajatuksesi palvelusta."
        submitLabel="Lähetä"
      />,
    );

    expect(
      screen.getByLabelText("Sähköposti (vapaaehtoinen)"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Viesti")).toBeInTheDocument();
  });

  it("shows a validation error and does not submit when the message is too short", async () => {
    render(
      <FeedbackForm
        title="Anna palautetta"
        description="Kerro ajatuksesi palvelusta."
        submitLabel="Lähetä"
      />,
    );

    const messageInput = screen.getByLabelText("Viesti");
    const submitButton = screen.getByRole("button", { name: "Lähetä" });

    await userEvent.type(messageInput, "Lyhyt");
    await userEvent.click(submitButton);

    expect(
      await screen.findByText(
        "Täytä pakolliset kentät ja kerro hieman tarkemmin.",
      ),
    ).toBeInTheDocument();
    expect(sendFeedbackEmailMock).not.toHaveBeenCalled();
  });

  it("submits successfully and shows a success message", async () => {
    sendFeedbackEmailMock.mockResolvedValueOnce(undefined);

    render(
      <FeedbackForm
        title="Anna palautetta"
        description="Kerro ajatuksesi palvelusta."
        submitLabel="Lähetä"
      />,
    );

    const messageInput = screen.getByLabelText("Viesti");
    const submitButton = screen.getByRole("button", { name: "Lähetä" });

    await userEvent.type(
      messageInput,
      "Tämä on pidempi palauteviesti käyttäjältä.",
    );
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(sendFeedbackEmailMock).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText("Palaute lähetetty!"),
    ).toBeInTheDocument();
  });

  it("shows an error message when submission fails", async () => {
    sendFeedbackEmailMock.mockRejectedValueOnce(new Error("Network error"));

    render(
      <FeedbackForm
        title="Anna palautetta"
        description="Kerro ajatuksesi palvelusta."
        submitLabel="Lähetä"
      />,
    );

    const messageInput = screen.getByLabelText("Viesti");
    const submitButton = screen.getByRole("button", { name: "Lähetä" });

    await userEvent.type(
      messageInput,
      "Tämä on pidempi palauteviesti käyttäjältä.",
    );
    await userEvent.click(submitButton);

    expect(
      await screen.findByText(
        "Palautteen lähetys epäonnistui, yritä hetken päästä uudelleen.",
      ),
    ).toBeInTheDocument();
  });

  it("treats honeypot submissions as success without calling the server action", async () => {
    render(
      <FeedbackForm
        title="Anna palautetta"
        description="Kerro ajatuksesi palvelusta."
        submitLabel="Lähetä"
      />,
    );

    const honeypot = screen.getByLabelText("Website");
    const messageInput = screen.getByLabelText("Viesti");
    const submitButton = screen.getByRole("button", { name: "Lähetä" });

    await userEvent.type(honeypot, "spam");
    await userEvent.type(
      messageInput,
      "Tämä palaute tulisi ohittaa honeypotin ansiosta.",
    );
    await userEvent.click(submitButton);

    expect(sendFeedbackEmailMock).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Palaute lähetetty!"),
    ).toBeInTheDocument();
  });
});

